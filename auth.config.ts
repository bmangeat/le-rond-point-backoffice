import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Config Edge-safe : aucun import Prisma ici (le middleware tourne en Edge Runtime
// où Prisma est interdit). Le provider Google est un simple objet de config.
// La logique qui touche la base (jwt/signIn) vit dans `auth.ts` (Node uniquement).
export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Mappe le token (rempli au login, côté Node) vers la session lisible partout,
    // y compris dans le middleware Edge. Pas d'accès base ici.
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub!;
        session.user.role = token.role as string | undefined;
        session.user.isActive = token.isActive as boolean | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
