import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

// Activité globale récente, reconstituée à partir des données existantes
// (le schéma n'a pas encore de table d'audit dédiée). Donne une idée de la
// vitalité de la plateforme tous groupes confondus.
async function getRecentActivity() {
  const [recentEvents, recentUsers, recentPhotos] = await Promise.all([
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        createdAt: true,
        group: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        createdAt: true,
        group: { select: { name: true } },
      },
    }),
    prisma.eventPhoto.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, createdAt: true, event: { select: { name: true } } },
    }),
  ]);

  type Entry = { id: string; at: Date; label: string; meta: string; icon: string };
  const entries: Entry[] = [
    ...recentEvents.map((e) => ({
      id: `ev-${e.id}`,
      at: e.createdAt,
      icon: "📅",
      label: `Sortie créée — « ${e.name} »`,
      meta: e.group?.name ?? "sans groupe",
    })),
    ...recentUsers.map((u) => ({
      id: `us-${u.id}`,
      at: u.createdAt,
      icon: "🧑",
      label: `Nouvel utilisateur — ${u.name}`,
      meta: u.group?.name ?? "orphelin",
    })),
    ...recentPhotos.map((p) => ({
      id: `ph-${p.id}`,
      at: p.createdAt,
      icon: "📸",
      label: `Photo ajoutée — « ${p.event.name} »`,
      meta: "Vercel Blob",
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  return entries.slice(0, 20);
}

export default async function LogsPage() {
  const entries = await getRecentActivity();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-fg">Logs &amp; activité</h1>
        <p className="mt-1 text-sm text-muted">
          Supervision des tâches de fond et de l&apos;activité globale.
        </p>
      </header>

      {/* Suivi du cron quotidien — TODO : brancher sur Vercel Cron */}
      <section className="card border-dashed">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-fg">
              Dernière exécution du cron <code className="text-sm">/api/cron/daily</code>
            </h2>
            <p className="mt-1 text-sm text-muted">
              Nettoyage des photos &gt; 7 j, alertes anniversaires, rappels de sortie.
            </p>
          </div>
          <span className="badge bg-busy/10 text-busy">À brancher</span>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-surface-raised p-4 text-sm text-muted">
          <p className="font-semibold text-fg">TODO — source de vérité manquante</p>
          <p className="mt-1">
            Le projet sera déployé sur Vercel avec Vercel Cron. La date de dernière
            exécution réussie n&apos;est pas encore persistée en base.
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              Option A — lire les <em>Cron Logs</em> via l&apos;API Vercel (
              <code>GET /v1/projects/&#123;id&#125;/crons</code>) avec un token.
            </li>
            <li>
              Option B — faire écrire au cron de le-rond-point une ligne
              <code> CronRun</code> (table à ajouter) à chaque run réussi, puis la
              lire ici.
            </li>
          </ul>
        </div>
      </section>

      {/* Activité récente reconstituée */}
      <section className="card overflow-hidden p-0">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-bold text-fg">Activité récente (tous groupes)</h2>
        </div>
        <ul>
          {entries.length === 0 && (
            <li className="px-5 py-10 text-center text-muted">Aucune activité.</li>
          )}
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-4 border-b border-border px-5 py-3 last:border-0"
            >
              <span className="text-lg">{e.icon}</span>
              <div className="flex-1 leading-tight">
                <div className="text-sm font-medium text-fg">{e.label}</div>
                <div className="text-xs text-muted">{e.meta}</div>
              </div>
              <time className="text-xs text-subtle">{formatDateTime(e.at)}</time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
