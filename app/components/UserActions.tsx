"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserActive, anonymizeUser } from "@/app/(app)/users/actions";
import {
  assignToGroup,
  removeFromGroup,
  promoteToAdmin,
  demoteToMember,
} from "@/app/(app)/groups/actions";

type GroupOption = { id: string; name: string };

export default function UserActions({
  userId,
  role,
  isActive,
  groupId,
  groups,
  anonymized,
}: {
  userId: string;
  role: string;
  isActive: boolean;
  groupId: string | null;
  groups: GroupOption[];
  anonymized: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [targetGroup, setTargetGroup] = useState("");
  const router = useRouter();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else setError(res.error ?? "Erreur");
    });
  }

  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <div className="space-y-4">
      {/* Statut du compte */}
      <div className="flex flex-wrap items-center gap-2">
        {isActive ? (
          <button
            className="rounded-xl border border-destructive/30 px-3 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
            disabled={isPending || isSuperAdmin}
            title={isSuperAdmin ? "Un Super Admin ne peut pas être désactivé" : ""}
            onClick={() => {
              if (confirm("Désactiver ce compte (soft delete) ?"))
                run(() => setUserActive(userId, false));
            }}
          >
            Désactiver le compte
          </button>
        ) : (
          <button
            className="btn-primary py-2 text-sm"
            disabled={isPending}
            onClick={() => run(() => setUserActive(userId, true))}
          >
            Réactiver le compte
          </button>
        )}
      </div>

      {/* Groupe & rôle */}
      {!isSuperAdmin && (
        <div className="flex flex-wrap items-center gap-2">
          {groupId === null ? (
            <>
              <select
                className="input w-auto min-w-[12rem] py-2"
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                disabled={isPending}
              >
                <option value="">Affecter à un groupe…</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <button
                className="btn-primary py-2 text-sm"
                disabled={isPending || !targetGroup}
                onClick={() => run(() => assignToGroup(userId, targetGroup))}
              >
                Affecter
              </button>
            </>
          ) : (
            <>
              {role === "MEMBER" && (
                <button
                  className="btn-ghost py-2 text-sm"
                  disabled={isPending}
                  onClick={() => run(() => promoteToAdmin(userId, groupId))}
                >
                  Promouvoir Admin
                </button>
              )}
              {role === "ADMIN" && (
                <button
                  className="btn-ghost py-2 text-sm"
                  disabled={isPending}
                  onClick={() => run(() => demoteToMember(userId, groupId))}
                >
                  Rétrograder Membre
                </button>
              )}
              <button
                className="rounded-xl px-3 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                disabled={isPending}
                onClick={() => {
                  if (confirm("Retirer du groupe ? Le compte deviendra orphelin."))
                    run(() => removeFromGroup(userId, groupId));
                }}
              >
                Retirer du groupe
              </button>
            </>
          )}
        </div>
      )}

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      {/* Zone RGPD — droit à l'effacement */}
      {!isSuperAdmin && (
        <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <div className="text-xs font-bold uppercase tracking-wide text-destructive">
            Zone RGPD
          </div>
          {anonymized ? (
            <p className="mt-1 text-sm text-muted">
              Ce compte a déjà été anonymisé (droit à l&apos;effacement exercé).
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">
                Efface définitivement les données d&apos;identification et de
                contact (nom, e-mail, téléphone, réseaux), supprime les
                abonnements push et les connexions. L&apos;historique du groupe
                est conservé sous « Compte supprimé ».
              </p>
              <button
                className="mt-2 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                disabled={isPending}
                onClick={() => {
                  if (
                    confirm(
                      "Anonymiser ce compte (droit à l'effacement RGPD) ? Cette action est IRRÉVERSIBLE.",
                    )
                  )
                    run(() => anonymizeUser(userId));
                }}
              >
                {isPending ? "…" : "Anonymiser (droit à l'effacement)"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
