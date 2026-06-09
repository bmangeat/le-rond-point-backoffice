"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateInvitation,
  deleteInvitation,
} from "@/app/(app)/groups/actions";
import CopyableLink from "@/app/components/CopyableLink";

type Invite = { id: string; url: string; expiresLabel: string };

export default function InvitationsCard({
  groupId,
  invites,
}: {
  groupId: string;
  invites: Invite[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function generate() {
    setError(null);
    startTransition(async () => {
      const res = await generateInvitation(groupId);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  function remove(id: string) {
    if (
      !confirm("Supprimer ce lien d'invitation ? Il ne sera plus utilisable.")
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await deleteInvitation(id, groupId);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <section className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-fg">Liens d&apos;invitation</h2>
          <p className="text-xs text-muted">
            À usage unique · 7 jours. La personne rejoint en{" "}
            <strong>Membre</strong> (promeus-la en Admin ci-dessous si besoin).
          </p>
        </div>
        <button
          className="btn-primary py-2 text-xs"
          onClick={generate}
          disabled={isPending}
        >
          {isPending ? "…" : "+ Générer un lien"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm font-medium text-destructive">{error}</p>
      )}

      <div className="mt-4 space-y-3">
        {invites.length === 0 && (
          <p className="text-sm text-muted">
            Aucun lien actif. Génère-en un pour inviter quelqu&apos;un.
          </p>
        )}
        {invites.map((inv) => (
          <div key={inv.id} className="rounded-xl border border-border p-3">
            <CopyableLink url={inv.url} />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-subtle">
                Expire le {inv.expiresLabel}
              </span>
              <button
                className="text-xs font-semibold text-destructive transition hover:underline disabled:opacity-50"
                onClick={() => remove(inv.id)}
                disabled={isPending}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
