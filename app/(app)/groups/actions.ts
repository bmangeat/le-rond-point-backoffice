"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertSuperAdmin } from "@/lib/admin";
import { generateSecureToken } from "@/lib/format";
import { buildInviteUrl } from "@/lib/invite";

export type ActionResult = { ok: true } | { ok: false; error: string };

// createGroup renvoie en plus le lien d'invitation généré, à montrer/copier.
export type CreateGroupResult =
  | { ok: true; inviteUrl: string }
  | { ok: false; error: string };

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours
const MEMBER_COLORS = 12; // palette 1-12, unique par groupe

/**
 * Choisit une couleur membre (1-12) libre dans le groupe cible. Si les 12 sont
 * déjà prises (groupe > 12 membres), on recycle la moins utilisée.
 */
async function pickMemberColor(groupId: string): Promise<number> {
  const members = await prisma.user.findMany({
    where: { groupId },
    select: { memberColor: true },
  });

  const counts = new Array<number>(MEMBER_COLORS + 1).fill(0);
  for (const m of members) {
    if (m.memberColor >= 1 && m.memberColor <= MEMBER_COLORS) {
      counts[m.memberColor]++;
    }
  }

  // 1ère couleur jamais utilisée, sinon la moins fréquente.
  let best = 1;
  for (let c = 1; c <= MEMBER_COLORS; c++) {
    if (counts[c] === 0) return c;
    if (counts[c] < counts[best]) best = c;
  }
  return best;
}

/**
 * Rattache un utilisateur orphelin (groupId = null) à un groupe existant et lui
 * attribue une couleur membre libre dans ce groupe. Son rôle reste MEMBER.
 */
export async function assignToGroup(
  userId: string,
  groupId: string,
): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
  } catch {
    return { ok: false, error: "Accès refusé." };
  }

  if (!groupId) return { ok: false, error: "Sélectionne un groupe." };

  const [user, group] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { groupId: true },
    }),
    prisma.group.findUnique({ where: { id: groupId }, select: { id: true } }),
  ]);

  if (!user) return { ok: false, error: "Utilisateur introuvable." };
  if (user.groupId) {
    return { ok: false, error: "Cet utilisateur appartient déjà à un groupe." };
  }
  if (!group) return { ok: false, error: "Groupe cible introuvable." };

  const memberColor = await pickMemberColor(groupId);

  await prisma.user.update({
    where: { id: userId },
    data: { groupId, memberColor },
  });

  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/");
  return { ok: true };
}

/**
 * Détache un membre de son groupe (le repasse orphelin : groupId = null) et
 * réinitialise son rôle à MEMBER. Un SUPER_ADMIN ne peut pas être détaché ici.
 */
export async function removeFromGroup(
  userId: string,
  groupId: string,
): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
  } catch {
    return { ok: false, error: "Accès refusé." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { groupId: true, role: true },
  });

  if (!user || user.groupId !== groupId) {
    return { ok: false, error: "Membre introuvable dans ce groupe." };
  }
  if (user.role === "SUPER_ADMIN") {
    return { ok: false, error: "Un Super Admin ne peut pas être détaché ici." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { groupId: null, role: "MEMBER" },
  });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Génère un nouveau lien d'invitation (générique, à usage unique, 7 j) pour un
 * groupe existant. Renvoie l'URL créée.
 */
export async function generateInvitation(
  groupId: string,
): Promise<CreateGroupResult> {
  try {
    await assertSuperAdmin();
  } catch {
    return { ok: false, error: "Accès refusé." };
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true },
  });
  if (!group) return { ok: false, error: "Groupe introuvable." };

  const token = generateSecureToken();
  await prisma.invitation.create({
    data: {
      groupId,
      token,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { ok: true, inviteUrl: buildInviteUrl(token) };
}

/**
 * Supprime un lien d'invitation d'un groupe (révoque le lien). Vérifie qu'il
 * appartient bien au groupe et qu'il n'a pas déjà été utilisé.
 */
export async function deleteInvitation(
  invitationId: string,
  groupId: string,
): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
  } catch {
    return { ok: false, error: "Accès refusé." };
  }

  const inv = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: { groupId: true, usedAt: true },
  });

  if (!inv || inv.groupId !== groupId) {
    return { ok: false, error: "Invitation introuvable dans ce groupe." };
  }
  if (inv.usedAt) {
    return { ok: false, error: "Cette invitation a déjà été utilisée." };
  }

  await prisma.invitation.delete({ where: { id: invitationId } });

  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}

/**
 * Crée un nouveau groupe et prépare, dans la MÊME transaction, un lien
 * d'invitation générique (à usage unique, 7 j) pour faire rejoindre le premier
 * membre du groupe. ⚠️ Le lien fait rejoindre en MEMBER : le rôle ADMIN se donne
 * ensuite manuellement via /groups/[id] (le modèle Invitation n'a pas de rôle).
 * Renvoie l'URL d'invitation à copier/transmettre.
 */
export async function createGroup(
  formData: FormData,
): Promise<CreateGroupResult> {
  try {
    await assertSuperAdmin();
  } catch {
    return { ok: false, error: "Accès refusé." };
  }

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) return { ok: false, error: "Le nom du groupe est requis." };
  if (name.length > 80) return { ok: false, error: "Nom trop long (80 max)." };

  const token = generateSecureToken();

  try {
    await prisma.$transaction(async (tx) => {
      const newGroup = await tx.group.create({ data: { name } });
      await tx.invitation.create({
        data: {
          groupId: newGroup.id,
          token,
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        },
      });
    });
  } catch (e) {
    console.error("createGroup failed", e);
    return { ok: false, error: "Échec de la création du groupe." };
  }

  revalidatePath("/groups");
  revalidatePath("/");
  return { ok: true, inviteUrl: buildInviteUrl(token) };
}

/**
 * Promeut un MEMBER d'un groupe au rang d'ADMIN de ce groupe.
 * Vérifie que l'utilisateur appartient bien au groupe ciblé.
 */
export async function promoteToAdmin(
  userId: string,
  groupId: string,
): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
  } catch {
    return { ok: false, error: "Accès refusé." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { groupId: true, role: true },
  });

  if (!user || user.groupId !== groupId) {
    return { ok: false, error: "Membre introuvable dans ce groupe." };
  }
  if (user.role === "SUPER_ADMIN") {
    return { ok: false, error: "Un Super Admin ne peut pas être rétrogradé ici." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: "ADMIN" },
  });

  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}

/**
 * Rétrograde un ADMIN local en MEMBER (utile si erreur de nomination).
 */
export async function demoteToMember(
  userId: string,
  groupId: string,
): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
  } catch {
    return { ok: false, error: "Accès refusé." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { groupId: true, role: true },
  });

  if (!user || user.groupId !== groupId) {
    return { ok: false, error: "Membre introuvable dans ce groupe." };
  }
  if (user.role !== "ADMIN") {
    return { ok: false, error: "Seul un Admin local peut être rétrogradé." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: "MEMBER" },
  });

  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}
