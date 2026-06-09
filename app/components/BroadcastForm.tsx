"use client";

import { useState, useTransition } from "react";
import { sendBroadcast, type BroadcastResult } from "@/app/(app)/broadcast/actions";

type GroupOption = { id: string; name: string };

export default function BroadcastForm({
  groups,
  pushConfigured,
}: {
  groups: GroupOption[];
  pushConfigured: boolean;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [groupId, setGroupId] = useState("");
  const [onlyPushEnabled, setOnlyPushEnabled] = useState(true);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (
      !confirm(
        "Envoyer cette notification push aux utilisateurs ciblés ? Action immédiate et irréversible.",
      )
    )
      return;
    setResult(null);
    const fd = new FormData();
    fd.set("title", title);
    fd.set("body", body);
    if (url) fd.set("url", url);
    if (groupId) fd.set("groupId", groupId);
    if (onlyPushEnabled) fd.set("onlyPushEnabled", "on");
    startTransition(async () => {
      const res = await sendBroadcast(fd);
      setResult(res);
      if (res.ok && res.sent > 0) {
        setTitle("");
        setBody("");
        setUrl("");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Composition */}
      <div className="card space-y-4">
        {!pushConfigured && (
          <div className="rounded-xl bg-busy/10 px-3 py-2 text-sm font-medium text-busy">
            ⚠️ Clés VAPID non configurées : l&apos;envoi échouera. Renseigne les
            mêmes clés que le-rond-point dans les variables d&apos;env.
          </div>
        )}

        <label className="block text-sm font-semibold text-fg">
          Titre
          <input
            className="input mt-1.5"
            placeholder="ex : Maintenance ce soir"
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
          />
          <span className="mt-1 block text-xs text-subtle">{title.length}/80</span>
        </label>

        <label className="block text-sm font-semibold text-fg">
          Message
          <textarea
            className="input mt-1.5 min-h-[90px] resize-y"
            placeholder="ex : L'app sera indisponible de 22h à 23h."
            value={body}
            maxLength={300}
            onChange={(e) => setBody(e.target.value)}
          />
          <span className="mt-1 block text-xs text-subtle">{body.length}/300</span>
        </label>

        <label className="block text-sm font-semibold text-fg">
          Lien à l&apos;ouverture (optionnel)
          <input
            className="input mt-1.5"
            placeholder="/sorties ou https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-fg">
            Cible
            <select
              className="input mt-1.5"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              <option value="">Tous les groupes</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-end gap-2 pb-2 text-sm font-medium text-fg">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={onlyPushEnabled}
              onChange={(e) => setOnlyPushEnabled(e.target.checked)}
            />
            Seulement push activé
          </label>
        </div>

        <button
          className="btn-primary w-full"
          onClick={submit}
          disabled={isPending || !title.trim() || !body.trim()}
        >
          {isPending ? "Envoi en cours…" : "Envoyer la notification"}
        </button>
      </div>

      {/* Aperçu + résultat */}
      <div className="space-y-4">
        <div className="card">
          <div className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Aperçu
          </div>
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-border bg-surface-raised p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192.png" alt="" className="h-10 w-10 rounded-lg" />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-fg">
                {title || "Titre de la notification"}
              </div>
              <div className="text-sm text-muted">
                {body || "Le message apparaîtra ici."}
              </div>
            </div>
          </div>
        </div>

        {result && (
          <div className="card">
            {result.ok ? (
              result.total === 0 ? (
                <p className="text-sm text-muted">
                  Aucun abonnement ne correspond à la cible. Rien envoyé.
                </p>
              ) : (
                <>
                  <div className="text-sm font-bold text-fg">
                    Envoi terminé ✅
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                    <Metric label="Ciblés" value={result.total} tone="muted" />
                    <Metric label="Réussis" value={result.sent} tone="ok" />
                    <Metric label="Échecs" value={result.failed} tone="fail" />
                  </div>
                  {result.removed > 0 && (
                    <p className="mt-3 text-xs text-subtle">
                      {result.removed} abonnement(s) mort(s) nettoyé(s).
                    </p>
                  )}
                </>
              )
            ) : (
              <p className="text-sm font-medium text-destructive">
                {result.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "muted" | "ok" | "fail";
}) {
  const color =
    tone === "ok"
      ? "text-available"
      : tone === "fail"
        ? "text-destructive"
        : "text-fg";
  return (
    <div className="rounded-xl border border-border bg-surface-raised py-3">
      <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
      <div className="text-xs font-semibold text-muted">{label}</div>
    </div>
  );
}
