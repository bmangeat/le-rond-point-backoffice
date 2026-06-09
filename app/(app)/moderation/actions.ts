"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertSuperAdmin } from "@/lib/admin";
import type { ActionResult } from "@/app/(app)/groups/actions";

/**
 * Supprime un commentaire signalé. Le onDelete: Cascade du schéma supprime
 * automatiquement toutes les CommentReport associées.
 * Utilisé quand le contenu signalé est jugé inapproprié.
 */
export async function deleteReportedComment(
  commentId: string,
): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
  } catch {
    return { ok: false, error: "Accès refusé." };
  }

  const comment = await prisma.eventComment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });
  if (!comment) return { ok: false, error: "Commentaire introuvable." };

  await prisma.eventComment.delete({ where: { id: commentId } });

  revalidatePath("/moderation/reports");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Rejette les signalements d'un commentaire (les supprime) mais garde le
 * commentaire. Utilisé quand après revue, le contenu est jugé acceptable.
 */
export async function dismissReports(
  commentId: string,
): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
  } catch {
    return { ok: false, error: "Accès refusé." };
  }

  const deleted = await prisma.commentReport.deleteMany({
    where: { commentId },
  });
  if (deleted.count === 0) {
    return { ok: false, error: "Aucun signalement à rejeter." };
  }

  revalidatePath("/moderation/reports");
  revalidatePath("/");
  return { ok: true };
}
