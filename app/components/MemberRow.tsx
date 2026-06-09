"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  promoteToAdmin,
  demoteToMember,
  removeFromGroup,
} from "@/app/(app)/groups/actions";
import { formatDate } from "@/lib/format";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
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

export default function MemberRow({
  member,
  groupId,
}: {
  member: Member;
  groupId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else setError(res.error ?? "Erreur");
    });
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-surface-raised/50">
      <td className="px-5 py-3.5">
        <div className="leading-tight">
          <div className="font-semibold text-fg">
            {member.name}
            {!member.isActive && (
              <span className="ml-2 text-xs font-normal text-subtle">(inactif)</span>
            )}
          </div>
          <div className="text-xs text-muted">{member.email}</div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-muted">{formatDate(member.createdAt)}</td>
      <td className="px-5 py-3.5">
        <span className={`badge ${ROLE_BADGE[member.role] ?? ""}`}>
          {ROLE_LABEL[member.role] ?? member.role}
        </span>
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-2">
          {member.role === "MEMBER" && (
            <button
              className="btn-ghost py-1.5 text-xs"
              disabled={isPending}
              onClick={() => run(() => promoteToAdmin(member.id, groupId))}
            >
              {isPending ? "…" : "Promouvoir Admin"}
            </button>
          )}
          {member.role === "ADMIN" && (
            <button
              className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-surface-raised"
              disabled={isPending}
              onClick={() => run(() => demoteToMember(member.id, groupId))}
            >
              {isPending ? "…" : "Rétrograder Membre"}
            </button>
          )}
          {member.role !== "SUPER_ADMIN" && (
            <button
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
              disabled={isPending}
              onClick={() => {
                if (
                  confirm(
                    `Retirer ${member.name} du groupe ? Le compte deviendra orphelin (rôle remis à Membre).`,
                  )
                ) {
                  run(() => removeFromGroup(member.id, groupId));
                }
              }}
            >
              {isPending ? "…" : "Retirer du groupe"}
            </button>
          )}
        </div>
        {error && (
          <div className="mt-1 text-right text-xs text-destructive">{error}</div>
        )}
      </td>
    </tr>
  );
}
