// Construction des liens d'invitation consommés par l'app le-rond-point.
// Format attendu : <APP_BASE_URL>/invite/<token>
// ⚠️ Server-only (lit APP_BASE_URL, pas NEXT_PUBLIC) : à appeler côté serveur,
// puis passer l'URL déjà construite aux composants client.

export function inviteBaseUrl(): string {
  return (process.env.APP_BASE_URL ?? "").replace(/\/+$/, "");
}

export function buildInviteUrl(token: string): string {
  const base = inviteBaseUrl();
  // Sans base configurée, on renvoie un chemin relatif (au moins le token reste
  // copiable) ; l'UI signale que APP_BASE_URL manque.
  return base ? `${base}/invite/${token}` : `/invite/${token}`;
}
