"use client";

import { useState, useTransition, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const params = useSearchParams();
  const authError = params.get("error");
  const isDev = process.env.NODE_ENV === "development";

  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  function devLogin() {
    if (!email.trim()) return;
    startTransition(async () => {
      await signIn("dev-login", { email: email.trim(), callbackUrl: "/" });
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-xl text-white">
            ⦿
          </div>
          <h1 className="text-xl font-extrabold text-fg">Backoffice Rond Point</h1>
          <p className="mt-1 text-sm text-muted">Réservé aux Super Admins.</p>
        </div>

        <div className="card space-y-4">
          {authError && (
            <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              Connexion refusée. Ce compte n&apos;est pas Super Admin.
            </div>
          )}

          <button
            className="btn-ghost w-full"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            <span>🔓</span> Se connecter avec Google
          </button>

          {isDev && (
            <>
              <div className="relative py-1 text-center">
                <span className="bg-surface px-2 text-xs text-subtle">
                  ou — bypass dev
                </span>
              </div>
              <div className="space-y-2">
                <input
                  className="input"
                  type="email"
                  placeholder="email Super Admin existant"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && devLogin()}
                />
                <button
                  className="btn-primary w-full"
                  onClick={devLogin}
                  disabled={isPending || !email.trim()}
                >
                  {isPending ? "Connexion…" : "Connexion dev"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
