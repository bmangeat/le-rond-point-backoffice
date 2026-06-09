// Petits formateurs partagés par l'UI.

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return dateFmt.format(new Date(d));
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return dateTimeFmt.format(new Date(d));
}

// Génère un token d'invitation sécurisé (URL-safe). Utilisé à la création de
// groupe pour préparer l'invitation du futur admin.
export function generateSecureToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
