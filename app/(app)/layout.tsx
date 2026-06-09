import { requireSuperAdmin } from "@/lib/admin";
import AppShell from "@/app/components/AppShell";

// Shell des pages authentifiées. Double sécurité : le middleware bloque déjà
// les non-SUPER_ADMIN, et ici on revérifie EN BASE avant tout rendu.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireSuperAdmin();

  return <AppShell admin={admin}>{children}</AppShell>;
}
