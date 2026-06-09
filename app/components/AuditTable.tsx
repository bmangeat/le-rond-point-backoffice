"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  createdLabel: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  groupId: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
};

const ACTION_META: Record<string, { label: string; tone: string }> = {
  USER_ANONYMIZED: { label: "Anonymisation", tone: "text-destructive" },
  USER_DEACTIVATED: { label: "Désactivation", tone: "text-busy" },
  USER_REACTIVATED: { label: "Réactivation", tone: "text-available" },
  USER_ASSIGNED_GROUP: { label: "Affectation groupe", tone: "text-fg" },
  USER_REMOVED_GROUP: { label: "Retrait groupe", tone: "text-busy" },
  ROLE_CHANGED: { label: "Changement de rôle", tone: "text-fg" },
  GROUP_CREATED: { label: "Création groupe", tone: "text-available" },
  INVITATION_GENERATED: { label: "Lien d'invitation", tone: "text-fg" },
  INVITATION_DELETED: { label: "Invitation supprimée", tone: "text-busy" },
  COMMENT_DELETED: { label: "Commentaire supprimé", tone: "text-destructive" },
  REPORTS_DISMISSED: { label: "Signalements rejetés", tone: "text-fg" },
  EVENT_CANCELLED: { label: "Sortie annulée", tone: "text-destructive" },
  EVENT_RESTORED: { label: "Sortie restaurée", tone: "text-available" },
  BROADCAST_SENT: { label: "Broadcast push", tone: "text-primary" },
};

function targetHref(type: string, id: string): string | null {
  if (type === "User") return `/users/${id}`;
  if (type === "Group") return `/groups/${id}`;
  if (type === "Event") return `/events/${id}`;
  return null;
}

function metaSummary(m: Record<string, unknown> | null): string {
  if (!m) return "";
  return Object.entries(m)
    .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(" · ");
}

export default function AuditTable({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [action, setAction] = useState("ALL");

  const actions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.action))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (action !== "ALL" && r.action !== action) return false;
      if (
        term &&
        !r.actorEmail.toLowerCase().includes(term) &&
        !r.targetId.toLowerCase().includes(term) &&
        !(r.reason ?? "").toLowerCase().includes(term)
      )
        return false;
      return true;
    });
  }, [rows, q, action]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Rechercher (acteur, cible, motif)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="input w-auto"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="ALL">Toutes les actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {ACTION_META[a]?.label ?? a}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Acteur</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Cible</th>
                <th className="px-5 py-3">Détails</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">
                    Aucune entrée.
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const meta = ACTION_META[r.action];
                const href = targetHref(r.targetType, r.targetId);
                return (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 align-top hover:bg-surface-raised/50"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-muted">
                      {r.createdLabel}
                    </td>
                    <td className="px-5 py-3 text-muted">{r.actorEmail}</td>
                    <td className="px-5 py-3">
                      <span className={`font-semibold ${meta?.tone ?? "text-fg"}`}>
                        {meta?.label ?? r.action}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-subtle">{r.targetType}</span>
                      <br />
                      {href ? (
                        <Link
                          href={href}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {r.targetId.slice(0, 12)}…
                        </Link>
                      ) : (
                        <span className="font-mono text-xs text-muted">
                          {r.targetId}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted">
                      {r.reason && <div>« {r.reason} »</div>}
                      {r.metadata && <div>{metaSummary(r.metadata)}</div>}
                      {!r.reason && !r.metadata && "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-subtle">
        {filtered.length} entrée{filtered.length > 1 ? "s" : ""} affichée
        {filtered.length > 1 ? "s" : ""} sur {rows.length} (200 plus récentes).
      </p>
    </div>
  );
}
