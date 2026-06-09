// Suffixe d'e-mail des comptes anonymisés (RGPD). Permet de repérer un compte
// effacé sans ajouter de champ au schéma (qui appartient à le-rond-point).
export const ANONYMIZED_EMAIL_DOMAIN = "@deleted.invalid";

export function isAnonymizedEmail(email: string): boolean {
  return email.endsWith(ANONYMIZED_EMAIL_DOMAIN);
}
