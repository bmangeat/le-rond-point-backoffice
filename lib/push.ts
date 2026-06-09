import webpush from "web-push";

// VAPID — MÊMES clés que le-rond-point, sinon les abonnements (créés côté app)
// seront rejetés par les services de push (signature invalide).
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT
let configured = false;

export function isPushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

function ensureConfigured() {
  if (configured) return;
  if (!isPushConfigured()) {
    throw new Error("VAPID non configuré (clés manquantes).");
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

export type PushTarget = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export type SendOutcome =
  | { ok: true }
  | { ok: false; gone: boolean; status?: number; error: string };

/**
 * Envoie une notification à un abonnement. `gone` = true si l'endpoint est mort
 * (404/410) → l'abonnement peut être supprimé en base.
 */
export async function sendToSubscription(
  target: PushTarget,
  payload: PushPayload,
): Promise<SendOutcome> {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      {
        endpoint: target.endpoint,
        keys: { p256dh: target.p256dh, auth: target.auth },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || "/",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
      }),
    );
    return { ok: true };
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    const gone = status === 404 || status === 410;
    return {
      ok: false,
      gone,
      status,
      error: (e as Error).message ?? "Échec de l'envoi",
    };
  }
}
