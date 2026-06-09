"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertSuperAdmin } from "@/lib/admin";
import type { ActionResult } from "@/app/(app)/groups/actions";

/**
 * Active / désactive un compte (soft delete via isActive). Un SUPER_ADMIN ne peut
 * pas être désactivé ici (anti-lockout).
 */
export async function setUserActive(
  userId: string,
  active: boolean,
): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
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

  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");
  revalidatePath("/");
  return { ok: true };
}
