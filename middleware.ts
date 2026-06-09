import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./auth.config";

// Middleware Edge : utilise UNIQUEMENT la config Edge-safe (pas de Prisma).
// Il lit le rôle stocké dans le JWT au login pour faire un blocage rapide.
// L'autorisation réelle (relecture en base) se refait dans chaque page/action
// via requireSuperAdmin() — cf. lib/admin.ts.
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/403"];

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const session = req.auth;
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  // Routes publiques (page de login, page d'erreur 403).
  if (PUBLIC_PATHS.includes(path)) {
    // Déjà SUPER_ADMIN connecté sur /login → vers le tableau de bord.
    if (path === "/login" && isSuperAdmin) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  // Non connecté → login.
  if (!session) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Connecté mais pas SUPER_ADMIN → 403 immédiat, sans charger l'interface.
  if (!isSuperAdmin) {
    return NextResponse.redirect(new URL("/403", nextUrl));
  }

  return NextResponse.next();
});

// On exclut les assets statiques et les routes API d'auth du contrôle.
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico)$).*)"],
};
