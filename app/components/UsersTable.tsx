"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  groupId: string | null;
  groupName: string | null;
  createdLabel: string;
};

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: "bg-primary/10 text-primary",
  ADMIN: "bg-available/10 text-available",
  MEMBER: "bg-surface-raised text-muted",
};
const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MEMBER: "Membre",
};

const FILTERS = [
  { key: "ALL", label: "Tous" },
  { key: "SUPER_ADMIN", label: "Super Admins" },
  { key: "ADMIN", label: "Admins" },
  { key: "MEMBER", label: "Membres" },
  { key: "ORPHAN", label: "Orphelins" },
  { key: "INACTIVE", label: "Inactifs" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default function UsersTable({ users }: { users: Row[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterKey>("ALL");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === "ORPHAN" && u.groupId !== null) return false;
      if (filter === "INACTIVE" && u.isActive) return false;
      if (
        (filter === "SUPER_ADMIN" || filter === "ADMIN" || filter === "MEMBER") &&
        u.role !== filter
      )
        return false;
      if (
        term &&
        !u.name.toLowerCase().includes(term) &&
        !u.email.toLowerCase().includes(term)
      )
        return false;
      return true;
    });
  }, [users, q, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Rechercher par nom ou email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === f.key
                  ? "bg-primary text-white"
                  : "bg-surface-raised text-muted hover:text-fg"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-subtle">
              <th className="px-5 py-3">Utilisateur</th>
              <th className="px-5 py-3">Groupe</th>
              <th className="px-5 py-3">Rôle</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted">
                  Aucun utilisateur ne correspond.
                </td>
              </tr>
            )}
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="border-b border-border last:border-0 hover:bg-surface-raised/50"
              >
                <td className="px-5 py-3.5">
                  <Link href={`/users/${u.id}`} className="block leading-tight">
                    <div className="font-semibold text-fg hover:text-primary hover:underline">
                      {u.name}
                    </div>
                    <div className="text-xs text-muted">{u.email}</div>
                  </Link>
                </td>
                <td className="px-5 py-3.5">
                  {u.groupId ? (
                    <Link
                      href={`/groups/${u.groupId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {u.groupName}
                    </Link>
                  ) : (
                    <span className="badge bg-busy/10 text-busy">Orphelin</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`badge ${ROLE_BADGE[u.role] ?? ""}`}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {u.isActive ? (
                    <span className="badge bg-available/10 text-available">
                      Actif
                    </span>
                  ) : (
                    <span className="badge bg-surface-raised text-subtle">
                      Inactif
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-muted">{u.createdLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <p className="text-xs text-subtle">
        {filtered.length} utilisateur{filtered.length > 1 ? "s" : ""} affiché
        {filtered.length > 1 ? "s" : ""} sur {users.length}.
      </p>
    </div>
  );
}
