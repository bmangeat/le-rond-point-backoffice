import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type SuperAdmin = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

/**
 * Garde-fou serveur (Node) : revérifie EN BASE que l'utilisateur courant est
 * bien SUPER_ADMIN et actif — on ne se fie jamais au rôle du token, qui peut
 * être périmé. À appeler en tête de chaque page et Server Action sensible.
 *
 * - non connecté        → redirige vers /login
 * - connecté ≠ SUPER_ADMIN → redirige vers /403
 */
export async function requireSuperAdmin(): Promise<SuperAdmin> {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true, email: true, name: true, image: true, role: true, isActive: true },
  });

  if (!user || !user.isActive || user.role !== "SUPER_ADMIN") {
    redirect("/403");
  }

  return { id: user.id, email: user.email, name: user.name, image: user.image };
}

/**
 * Variante non-redirigeante pour les Server Actions : renvoie l'admin ou lève
 * une erreur (à catcher pour renvoyer un message d'échec propre au client).
 */
export async function assertSuperAdmin(): Promise<SuperAdmin> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("UNAUTHENTICATED");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true, email: true, name: true, image: true, role: true, isActive: true },
  });

  if (!user || !user.isActive || user.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN");
  }

  return { id: user.id, email: user.email, name: user.name, image: user.image };
}
