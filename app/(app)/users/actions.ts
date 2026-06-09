"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertSuperAdmin } from "@/lib/admin";
import { ANONYMIZED_EMAIL_DOMAIN } from "@/lib/anonymize";
import { logAudit, AUDIT } from "@/lib/audit";
import type { ActionResult } from "@/app/(app)/groups/actions";

/**
 * Active / désactive un compte (soft delete via isActive). Un SUPER_ADMIN ne peut
 * pas être désactivé ici (anti-lockout).
 */
export async function setUserActive(
  userId: string,
  active: boolean,
): Promise<ActionResult> {
  let admin;
  try {
    admin = await assertSuperAdmin();
  } catch {
    return { ok: false, error: "Accès refusé." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });
  if (!user) return { ok: false, error: "Utilisateur introuvable." };
  if (!active && user.role === "SUPER_ADMIN") {
    return { ok: false, error: "Un Super Admin ne peut pas être désactivé." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: active },
  });

  await logAudit(
    admin,
    active ? AUDIT.USER_REACTIVATED : AUDIT.USER_DEACTIVATED,
    { type: "User", id: userId },
  );

  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Droit à l'effacement (RGPD) — anonymise un compte : efface les données
 * d'identification et de contact, supprime les abonnements push, les comptes
 * OAuth et les sessions. Le compte est conservé (anonymisé) pour préserver
 * l'intégrité de l'historique du groupe (sorties, présences, commentaires
 * deviennent attribués à « Compte supprimé »).
 *
 * Irréversible. Un SUPER_ADMIN ne peut pas être anonymisé ici.
 */
export async function anonymizeUser(userId: string): Promise<ActionResult> {
  let admin;
  try {
    admin = await assertSuperAdmin();
  } catch {
    return { ok: false, error: "Accès refusé." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });
  if (!user) return { ok: false, error: "Utilisateur introuvable." };
  if (user.role === "SUPER_ADMIN") {
    return { ok: false, error: "Un Super Admin ne peut pas être anonymisé." };
  }
  if (user.email.endsWith(ANONYMIZED_EMAIL_DOMAIN)) {
    return { ok: false, error: "Ce compte est déjà anonymisé." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        name: "Compte supprimé",
        email: `deleted-${userId}${ANONYMIZED_EMAIL_DOMAIN}`,
        image: null,
        city: null,
        birthday: null,
        phone: null,
        instagram: null,
        snapchat: null,
        tiktok: null,
        linkedin: null,
        isActive: false,
        groupId: null,
        role: "MEMBER",
        onboardedAt: null,
        notifPush: false,
        notifEmail: false,
      },
    }),
    // Données d'identité / contact technique → suppression réelle.
    prisma.pushSubscription.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
  ]);

  // ⚠️ Aucune donnée perso du compte effacé dans l'audit (ce serait contraire
  // au but de l'anonymisation) — seul l'id technique est tracé.
  await logAudit(admin, AUDIT.USER_ANONYMIZED, { type: "User", id: userId });

  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");
  revalidatePath("/");
  return { ok: true };
}
