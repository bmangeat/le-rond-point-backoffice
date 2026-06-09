import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="max-w-md text-center">
        <div className="text-6xl font-black text-destructive">403</div>
        <h1 className="mt-4 text-xl font-extrabold text-fg">Accès refusé</h1>
        <p className="mt-2 text-sm text-muted">
          Ce backoffice est réservé aux comptes <strong>Super Admin</strong>. Ton
          compte ne dispose pas des droits nécessaires.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login" className="btn-ghost">
            Changer de compte
          </Link>
        </div>
      </div>
    </div>
  );
}
