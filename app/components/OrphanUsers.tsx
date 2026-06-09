"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignToGroup } from "@/app/(app)/groups/actions";

type Orphan = { id: string; name: string; email: string };
type GroupOption = { id: string; name: string };

function OrphanRow({
  orphan,
  groups,
}: {
  orphan: Orphan;
  groups: GroupOption[];
}) {
  const [groupId, setGroupId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function assign() {
    if (!groupId) return;
    setError(null);
    startTransition(async () => {
      const res = await assignToGroup(orphan.id, groupId);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3 last:border-0">
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate font-semibold text-fg">{orphan.name}</div>
        <div className="truncate text-xs text-muted">{orphan.email}</div>
      </div>
      <select
        className="input w-auto min-w-[12rem] py-2"
        value={groupId}
        onChange={(e) => setGroupId(e.target.value)}
        disabled={isPending}
      >
        <option value="">Choisir un groupe…</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <button
        className="btn-primary py-2 text-xs"
        onClick={assign}
        disabled={isPending || !groupId}
      >
        {isPending ? "…" : "Affecter"}
      </button>
      {error && (
        <div className="w-full text-xs text-destructive">{error}</div>
      )}
    </li>
  );
}

export default function OrphanUsers({
  orphans,
  groups,
}: {
  orphans: Orphan[];
  groups: GroupOption[];
}) {
  if (orphans.length === 0) return null;

  return (
    <section className="card overflow-hidden border-busy/40 p-0">
      <div className="flex items-center justify-between border-b border-border bg-busy/5 px-5 py-4">
        <div>
          <h2 className="font-bold text-fg">
            Utilisateurs orphelins{" "}
            <span className="badge bg-busy/10 text-busy">{orphans.length}</span>
          </h2>
          <p className="text-xs text-muted">
            Comptes sans groupe — choisis un Rond Point pour les rattacher.
          </p>
        </div>
      </div>
      <ul>
        {orphans.map((o) => (
          <OrphanRow key={o.id} orphan={o} groups={groups} />
        ))}
      </ul>
    </section>
  );
}
