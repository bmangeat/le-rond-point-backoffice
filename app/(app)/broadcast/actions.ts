"use server";

import { prisma } from "@/lib/prisma";
import { assertSuperAdmin } from "@/lib/admin";
import { isPushConfigured, sendToSubscription } from "@/lib/push";
import { logAudit, AUDIT } from "@/lib/audit";

export type BroadcastResult =
  | {
      ok: true;
      total: number;
      sent: number;
      failed: number;
      removed: number;
    }
  | { ok: false; error: string };

const BATCH = 50;

/**
 * Envoie une notification push à tous les abonnements ciblés (utilisateurs de
 * l'app le-rond-point). Nettoie au passage les abonnements morts (404/410).
 */
export async function sendBroadcast(formData: FormData): Promise<BroadcastResult> {
  let admin;
  try {
    admin = await assertSuperAdmin();
  } catch {
    return { ok: false, error: "Accès refusé." };
  }

  if (!isPushConfigured()) {
    return {
      ok: false,
      error:
        "Clés VAPID manquantes (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT). Utilise les MÊMES que le-rond-point.",
    };
  }

  const title = (formData.get("title") as string | null)?.trim();
  const body = (formData.get("body") as string | null)?.trim();
  const url = (formData.get("url") as string | null)?.trim() || undefined;
  const groupId = (formData.get("groupId") as string | null)?.trim() || null;
  const onlyPushEnabled = formData.get("onlyPushEnabled") === "on";

  if (!title) return { ok: false, error: "Le titre est requis." };
  if (!body) return { ok: false, error: "Le message est requis." };
  if (title.length > 80) return { ok: false, error: "Titre trop long (80 max)." };
  if (body.length > 300) return { ok: false, error: "Message trop long (300 max)." };

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      user: {
        isActive: true,
        ...(groupId ? { groupId } : {}),
        ...(onlyPushEnabled ? { notifPush: true } : {}),
      },
    },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  if (subscriptions.length === 0) {
    return { ok: true, total: 0, sent: 0, failed: 0, removed: 0 };
  }

  let sent = 0;
  let failed = 0;
  const deadIds: string[] = [];

  for (let i = 0; i < subscriptions.length; i += BATCH) {
    const chunk = subscriptions.slice(i, i + BATCH);
    const outcomes = await Promise.all(
      chunk.map((s) =>
        sendToSubscription(
          { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
          { title, body, url },
        ).then((res) => ({ res, id: s.id })),
      ),
    );
    for (const { res, id } of outcomes) {
      if (res.ok) sent++;
      else {
        failed++;
        if (res.gone) deadIds.push(id);
      }
    }
  }

  // Nettoyage des abonnements morts (endpoints expirés / désinscrits).
  if (deadIds.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: deadIds } } });
  }

  await logAudit(
    admin,
    AUDIT.BROADCAST_SENT,
    { type: "Broadcast", id: groupId ?? "all" },
    {
      groupId,
      metadata: { title, sent, failed, total: subscriptions.length },
    },
  );

  return {
    ok: true,
    total: subscriptions.length,
    sent,
    failed,
    removed: deadIds.length,
  };
}
