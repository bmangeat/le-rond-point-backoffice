"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteReportedComment,
  dismissReports,
} from "@/app/(app)/moderation/actions";

export type ReportedComment = {
  commentId: string;
  text: string;
  authorName: string;
  authorId: string;
  createdLabel: string;
  eventName: string;
  groupName: string | null;
  groupId: string | null;
  reports: {
    id: string;
    reporterName: string;
    reporterEmail: string;
    reason: string | null;
    createdLabel: string;
  }[];
};

export default function ReportedCommentCard({
  data,
}: {
  data: ReportedComment;
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

  const reportCount = data.reports.length;

  return (
    <article className="card border-destructive/30">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="badge bg-destructive/10 text-destructive">
            🚩 {reportCount} signalement{reportCount > 1 ? "s" : ""}
          </span>
          <span className="text-xs text-muted">
            Sortie « {data.eventName} »
            {data.groupId && data.groupName && (
              <>
                {" · "}
                <Link
                  href={`/groups/${data.groupId}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {data.groupName}
                </Link>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Contenu signalé */}
      <blockquote className="mt-3 rounded-xl border border-border bg-surface-raised p-4">
        <p className="whitespace-pre-wrap text-sm text-fg">“{data.text}”</p>
        <footer className="mt-2 text-xs text-muted">
          —{" "}
          <Link
            href={`/users/${data.authorId}`}
            className="font-semibold text-primary hover:underline"
          >
            {data.authorName}
          </Link>{" "}
          · {data.createdLabel}
        </footer>
      </blockquote>

      {/* Reporters */}
      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-subtle">
          Signalé par
        </div>
        <ul className="mt-2 space-y-2">
          {data.reports.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-border bg-surface px-3 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="text-sm font-semibold text-fg">
                  {r.reporterName}{" "}
                  <span className="font-normal text-muted">
                    · {r.reporterEmail}
                  </span>
                </span>
                <span className="text-xs text-subtle">{r.createdLabel}</span>
              </div>
              {r.reason && (
                <p className="mt-1 text-sm text-muted">« {r.reason} »</p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-destructive">{error}</p>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <button
          className="btn-ghost py-2 text-sm"
          disabled={isPending}
          onClick={() => {
            if (
              confirm(
                "Rejeter les signalements ? Le commentaire reste visible, les rapports sont effacés.",
              )
            )
              run(() => dismissReports(data.commentId));
          }}
        >
          Rejeter les signalements
        </button>
        <button
          className="rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          disabled={isPending}
          onClick={() => {
            if (
              confirm(
                "Supprimer définitivement ce commentaire ? Action irréversible.",
              )
            )
              run(() => deleteReportedComment(data.commentId));
          }}
        >
          {isPending ? "…" : "Supprimer le commentaire"}
        </button>
      </div>
    </article>
  );
}
