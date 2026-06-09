"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertSuperAdmin } from "@/lib/admin";
import { logAudit, AUDIT } from "@/lib/audit";
import type { ActionResult } from "@/app/(app)/groups/actions";

/**
 * Annule une sortie (cancelledAt + raison). N'efface rien : la sortie reste
 * consultable, marquée annulée. Idempotent si déjà annulée.
 */
export async function cancelEvent(
  eventId: string,
  reason: string,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await assertSuperAdmin();
  } catch {
    return { ok: false, error: "Accès refusé." };
  }

  const trimmed = reason.trim();
  if (!trimmed) return { ok: false, error: "La raison est requise." };
  if (trimmed.length > 500)
    return { ok: false, error: "Raison trop longue (500 max)." };

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, cancelledAt: true, groupId: true },
  });
  if (!event) return { ok: false, error: "Sortie introuvable." };
  if (event.cancelledAt) return { ok: false, error: "Sortie déjà annulée." };

  await prisma.event.update({
    where: { id: eventId },
    data: { cancelledAt: new Date(), cancelReason: trimmed },
  });

  await logAudit(admin, AUDIT.EVENT_CANCELLED, { type: "Event", id: eventId }, {
    groupId: event.groupId,
    reason: trimmed,
  });

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Restaure une sortie annulée (remet cancelledAt/cancelReason à null).
 */
export async function restoreEvent(eventId: string): Promise<ActionResult> {
  let admin;
  try {
    admin = await assertSuperAdmin();
  } catch {
    return { ok: false, error: "Accès refusé." };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, cancelledAt: true, groupId: true },
  });
  if (!event) return { ok: false, error: "Sortie introuvable." };
  if (!event.cancelledAt) return { ok: false, error: "Sortie déjà active." };

  await prisma.event.update({
    where: { id: eventId },
    data: { cancelledAt: null, cancelReason: null },
  });

  await logAudit(admin, AUDIT.EVENT_RESTORED, { type: "Event", id: eventId }, {
    groupId: event.groupId,
  });

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/");
  return { ok: true };
}
