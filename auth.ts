import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import authConfig from "./auth.config";
import { prisma } from "@/lib/prisma";

// Config complète (Node only) : ajoute le provider dev + les callbacks qui lisent
// la base. Importé par les routes API et les Server Components/Actions — JAMAIS
// par le middleware (qui n'utilise que `auth.config.ts`, Edge-safe).
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    ...authConfig.providers,
    // Bypass dev : invisible en prod. Se connecter avec un email SUPER_ADMIN existant.
    ...(process.env.NODE_ENV === "development"
      ? [
          Credentials({
            id: "dev-login",
            name: "Dev login (email)",
            credentials: { email: { label: "Email", type: "email" } },
            async authorize(creds) {
              const email = (creds?.email as string | undefined)
                ?.trim()
                .toLowerCase();
              if (!email) return null;
              const user = await prisma.user.findUnique({ where: { email } });
              if (!user) return null;
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Au login : on vérifie en base que le compte est bien SUPER_ADMIN et actif.
    // Toute autre identité est refusée AVANT même de créer une session.
    async signIn({ user }) {
      if (!user?.email) return false;
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase() },
        select: { role: true, isActive: true },
      });
      return !!dbUser && dbUser.isActive && dbUser.role === "SUPER_ADMIN";
    },
    // Charge id/role/isActive depuis la base dans le token, au login uniquement
    // (quand `user` est présent). Les requêtes suivantes réutilisent le token.
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, role: true, isActive: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.isActive = dbUser.isActive;
        }
      }
      return token;
    },
  },
});
