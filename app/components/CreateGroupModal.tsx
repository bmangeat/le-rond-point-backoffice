"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGroup } from "@/app/(app)/groups/actions";
import CopyableLink from "@/app/components/CopyableLink";

export default function CreateGroupModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function reset() {
    setName("");
    setError(null);
    setInviteUrl(null);
  }

  function close() {
    setOpen(false);
    reset();
    router.refresh();
  }

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    startTransition(async () => {
      const res = await createGroup(fd);
      if (res.ok) setInviteUrl(res.inviteUrl);
      else setError(res.error);
    });
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        + Nouveau groupe
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {!inviteUrl ? (
              <>
                <h2 className="text-lg font-extrabold text-fg">
                  Créer un Rond Point
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Un lien d&apos;invitation (valable 7 jours, à usage unique) est
                  généré automatiquement.
                </p>

                <label className="mt-4 block text-sm font-semibold text-fg">
                  Nom du groupe
                  <input
                    autoFocus
                    className="input mt-1.5"
                    placeholder="ex : Potes de Fac"
                    value={name}
                    maxLength={80}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && name.trim()) submit();
                    }}
                  />
                </label>

                {error && (
                  <p className="mt-3 text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    className="btn-ghost"
                    onClick={close}
                    disabled={isPending}
                  >
                    Annuler
                  </button>
                  <button
                    className="btn-primary"
                    onClick={submit}
                    disabled={isPending || !name.trim()}
                  >
                    {isPending ? "Création…" : "Créer le groupe"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <h2 className="text-lg font-extrabold text-fg">
                    Groupe « {name} » créé
                  </h2>
                </div>
                <p className="text-sm text-muted">
                  Partage ce lien à la personne qui rejoindra le groupe :
                </p>

                <div className="mt-3">
                  <CopyableLink url={inviteUrl} />
                </div>

                <div className="mt-3 rounded-xl border border-busy/30 bg-busy/5 p-3 text-xs text-muted">
                  <p className="font-semibold text-fg">
                    Pour nommer un admin
                  </p>
                  <p className="mt-0.5">
                    Le lien fait rejoindre en tant que <strong>Membre</strong>.
                    Une fois la personne inscrite, promeus-la en{" "}
                    <strong>Admin</strong> depuis la fiche du groupe.
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <button className="btn-primary" onClick={close}>
                    Terminé
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
