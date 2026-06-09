"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EVENT_TYPE_META } from "@/lib/events";

type Row = {
  id: string;
  name: string;
  type: string;
  whenLabel: string;
  whenAt: string;
  groupName: string | null;
  groupId: string | null;
  hostName: string;
  cancelled: boolean;
  yesCount: number;
};

const TYPE_FILTERS = ["ALL", "BAR", "RESTO", "SOIREE", "SORTIE"] as const;
const STATUS_FILTERS = [
  { key: "ALL", label: "Toutes" },
  { key: "ACTIVE", label: "Actives" },
  { key: "CANCELLED", label: "Annulées" },
] as const;

export default function EventsTable({ events }: { events: Row[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return events.filter((e) => {
      if (type !== "ALL" && e.type !== type) return false;
      if (status === "ACTIVE" && e.cancelled) return false;
      if (status === "CANCELLED" && !e.cancelled) return false;
      if (
        term &&
        !e.name.toLowerCase().includes(term) &&
        !e.hostName.toLowerCase().includes(term)
      )
        return false;
      return true;
    });
  }, [events, q, type, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Rechercher (nom, hôte)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                type === t
                  ? "bg-primary text-white"
                  : "bg-surface-raised text-muted hover:text-fg"
              }`}
            >
              {t === "ALL" ? "Tous types" : EVENT_TYPE_META[t].label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatus(s.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                status === s.key
                  ? "bg-fg text-white"
                  : "bg-surface-raised text-muted hover:text-fg"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                <th className="px-5 py-3">Sortie</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Quand</th>
                <th className="px-5 py-3">Groupe</th>
                <th className="px-5 py-3">Hôte</th>
                <th className="px-5 py-3">Présents</th>
                <th className="px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted">
                    Aucune sortie ne correspond.
                  </td>
                </tr>
              )}
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-border last:border-0 hover:bg-surface-raised/50"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/events/${e.id}`}
                      className="font-semibold text-fg hover:text-primary hover:underline"
                    >
                      {e.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`badge ${EVENT_TYPE_META[e.type]?.badge ?? ""}`}
                    >
                      {EVENT_TYPE_META[e.type]?.label ?? e.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted">{e.whenLabel}</td>
                  <td className="px-5 py-3.5">
                    {e.groupId ? (
                      <Link
                        href={`/groups/${e.groupId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {e.groupName}
                      </Link>
                    ) : (
                      <span className="text-subtle">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-muted">{e.hostName}</td>
                  <td className="px-5 py-3.5">
                    <span className="badge bg-surface-raised text-available">
                      {e.yesCount}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {e.cancelled ? (
                      <span className="badge bg-destructive/10 text-destructive">
                        Annulée
                      </span>
                    ) : (
                      <span className="badge bg-available/10 text-available">
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-subtle">
        {filtered.length} sortie{filtered.length > 1 ? "s" : ""} affichée
        {filtered.length > 1 ? "s" : ""} sur {events.length}.
      </p>
    </div>
  );
}
