"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelEvent, restoreEvent } from "@/app/(app)/events/actions";

export default function EventStatusActions({
  eventId,
  cancelled,
  cancelReason,
}: {
  eventId: string;
  cancelled: boolean;
  cancelReason: string | null;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else setError(res.error ?? "Erreur");
    });
  }

  if (cancelled) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <div className="text-sm font-bold text-destructive">Sortie annulée</div>
        {cancelReason && (
          <p className="mt-1 text-sm text-muted">Raison : « {cancelReason} »</p>
        )}
        <button
          className="btn-ghost mt-3 py-2 text-sm"
          disabled={isPending}
          onClick={() => run(() => restoreEvent(eventId))}
        >
          {isPending ? "…" : "Restaurer la sortie"}
        </button>
        {error && (
          <p className="mt-2 text-sm font-medium text-destructive">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="text-sm font-bold text-fg">Annuler la sortie</div>
      <p className="mt-1 text-xs text-muted">
        La sortie reste consultable, marquée annulée (raison visible).
      </p>
      <textarea
        className="input mt-3 min-h-[64px] resize-y"
        placeholder="Raison de l'annulation…"
        value={reason}
        maxLength={500}
        onChange={(e) => setReason(e.target.value)}
      />
      <button
        className="mt-3 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        disabled={isPending || !reason.trim()}
        onClick={() => {
          if (confirm("Annuler cette sortie ?"))
            run(() => cancelEvent(eventId, reason));
        }}
      >
        {isPending ? "…" : "Annuler la sortie"}
      </button>
      {error && (
        <p className="mt-2 text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
