import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Sparkline, HBars } from "@/app/components/charts";

export const dynamic = "force-dynamic";

// Quota Vercel Blob (rappel visuel pour éviter les surprises de facturation).
// Hobby = 1 Go inclus ; Pro = 100 Go. On estime ~3 Mo / photo (moyenne mobile).
const BLOB_AVG_PHOTO_BYTES = 3 * 1024 * 1024;
const BLOB_HOBBY_QUOTA_BYTES = 1 * 1024 * 1024 * 1024; // 1 Go

const MONTHS_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

// Couleurs par type de sortie (cohérentes avec le-rond-point).
const EVENT_TYPES: { key: string; label: string; color: string }[] = [
  { key: "BAR", label: "🍻 Bar", color: "#F59E0B" },
  { key: "RESTO", label: "🍕 Resto", color: "#F43F5E" },
  { key: "SOIREE", label: "🏡 Soirée", color: "#A855F7" },
  { key: "SORTIE", label: "🏕️ Sortie", color: "#10B981" },
];

function startOfMonthUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
function startOfNextMonthUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

// Inscriptions par mois sur les 12 derniers mois (buckets locaux).
function bucketSignups(dates: Date[]) {
  const now = new Date();
  const buckets: { label: string; year: number; month: number; count: number }[] =
    [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.push({
      label: MONTHS_FR[d.getUTCMonth()],
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      count: 0,
    });
  }
  for (const dt of dates) {
    const y = dt.getUTCFullYear();
    const m = dt.getUTCMonth();
    const b = buckets.find((x) => x.year === y && x.month === m);
    if (b) b.count++;
  }
  return buckets;
}

async function getDashboardData() {
  const [
    groupCount,
    activeUserCount,
    eventsThisMonth,
    photoCount,
    pendingReports,
    reachableUsers,
    signupDates,
    eventsByTypeRaw,
    groups,
  ] = await Promise.all([
    prisma.group.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.event.count({
      where: {
        whenAt: { gte: startOfMonthUTC(), lt: startOfNextMonthUTC() },
        cancelledAt: null,
      },
    }),
    prisma.eventPhoto.count(),
    prisma.eventComment.count({ where: { reports: { some: {} } } }),
    // Utilisateurs réellement joignables en push (push activé + ≥1 abonnement).
    prisma.user.count({
      where: { isActive: true, notifPush: true, pushSubscriptions: { some: {} } },
    }),
    prisma.user.findMany({ select: { createdAt: true } }),
    prisma.event.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.group.findMany({ select: { id: true, name: true } }),
  ]);

  // Top groupes : score = sorties + présences + photos.
  const groupActivity = await Promise.all(
    groups.map(async (g) => {
      const [events, presences, photos] = await Promise.all([
        prisma.event.count({ where: { groupId: g.id } }),
        prisma.presence.count({ where: { user: { groupId: g.id } } }),
        prisma.eventPhoto.count({ where: { event: { groupId: g.id } } }),
      ]);
      return {
        id: g.id,
        name: g.name,
        events,
        presences,
        photos,
        score: events + presences + photos,
      };
    }),
  );
  const topGroups = groupActivity
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const eventsByType = EVENT_TYPES.map((t) => ({
    ...t,
    value: eventsByTypeRaw.find((e) => e.type === t.key)?._count._all ?? 0,
  }));

  return {
    groupCount,
    activeUserCount,
    eventsThisMonth,
    photoCount,
    pendingReports,
    reachableUsers,
    signups: bucketSignups(signupDates.map((u) => u.createdAt)),
    eventsByType,
    topGroups,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const {
    groupCount,
    activeUserCount,
    eventsThisMonth,
    photoCount,
    pendingReports,
    reachableUsers,
    signups,
    eventsByType,
    topGroups,
  } = data;

  const estimatedBytes = photoCount * BLOB_AVG_PHOTO_BYTES;
  const quotaPct = Math.min(
    100,
    Math.round((estimatedBytes / BLOB_HOBBY_QUOTA_BYTES) * 100),
  );
  const quotaColor =
    quotaPct >= 90 ? "bg-destructive" : quotaPct >= 70 ? "bg-busy" : "bg-available";

  const totalSignups = signups.reduce((a, b) => a + b.count, 0);
  const usersMissingPush = Math.max(0, activeUserCount - reachableUsers);
  const pushCoveragePct =
    activeUserCount > 0
      ? Math.round((reachableUsers / activeUserCount) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-extrabold text-fg">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted">
          Vue d&apos;ensemble de la santé de la plateforme.
        </p>
      </header>

      {/* KPIs globaux */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi label="Groupes créés" value={groupCount} icon="👥" />
        <Kpi label="Utilisateurs actifs" value={activeUserCount} icon="🧑‍🤝‍🧑" />
        <Kpi label="Sorties ce mois-ci" value={eventsThisMonth} icon="📅" />
      </section>

      {/* Alerte modération : visible uniquement s'il y a des signalements à traiter. */}
      {pendingReports > 0 && (
        <Link
          href="/moderation/reports"
          className="card flex items-center justify-between gap-4 border-destructive/30 bg-destructive/5 transition hover:bg-destructive/10"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-lg">
              🚩
            </span>
            <div>
              <div className="text-sm font-bold text-fg">
                {pendingReports} commentaire{pendingReports > 1 ? "s" : ""}{" "}
                signalé{pendingReports > 1 ? "s" : ""} à traiter
              </div>
              <div className="text-xs text-muted">
                Conformité DSA — ouvrir la modération.
              </div>
            </div>
          </div>
          <span className="text-sm font-semibold text-destructive">→</span>
        </Link>
      )}

      {/* Évolution des inscriptions */}
      <section className="card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-fg">Inscriptions</h2>
            <p className="mt-1 text-sm text-muted">
              Évolution sur les 12 derniers mois ·{" "}
              <span className="font-semibold text-fg">{totalSignups}</span> au total.
            </p>
          </div>
          <span className="badge bg-surface-raised text-muted">
            {signups[signups.length - 1].count} ce mois-ci
          </span>
        </div>
        <div className="mt-4">
          <Sparkline values={signups.map((s) => s.count)} />
          <div className="mt-1 flex justify-between text-[10px] text-subtle">
            <span>{signups[0].label}</span>
            <span>{signups[Math.floor(signups.length / 2)].label}</span>
            <span>{signups[signups.length - 1].label}</span>
          </div>
        </div>
      </section>

      {/* Sorties par type + couverture push */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-base font-bold text-fg">Sorties par type</h2>
          <p className="mt-1 mb-4 text-sm text-muted">
            Répartition de toutes les sorties créées.
          </p>
          <HBars
            items={eventsByType.map((t) => ({
              label: t.label,
              value: t.value,
              color: t.color,
            }))}
          />
        </div>

        <div className="card">
          <h2 className="text-base font-bold text-fg">Couverture notifications</h2>
          <p className="mt-1 text-sm text-muted">
            {reachableUsers} / {activeUserCount} utilisateurs joignables en push.
          </p>
          <div className="mt-4">
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-raised">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pushCoveragePct}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>{pushCoveragePct}% couverts</span>
              <span
                className={
                  usersMissingPush > 0 ? "font-semibold text-busy" : "text-muted"
                }
              >
                {usersMissingPush} sans push
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-subtle">
            « Sans push » = compte actif avec notifications désactivées ou sans
            abonnement — ces membres ratent les alertes.
          </p>
        </div>
      </section>

      {/* Top groupes */}
      <section className="card">
        <h2 className="text-base font-bold text-fg">Groupes les plus actifs</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Score = sorties + présences + photos.
        </p>
        {topGroups.length === 0 ? (
          <p className="text-sm text-muted">Aucun groupe.</p>
        ) : (
          <ol className="space-y-2">
            {topGroups.map((g, i) => (
              <li key={g.id}>
                <Link
                  href={`/groups/${g.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:bg-surface-raised"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-raised text-sm font-extrabold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-fg">{g.name}</div>
                    <div className="text-xs text-muted">
                      {g.events} sortie{g.events > 1 ? "s" : ""} · {g.presences}{" "}
                      présence{g.presences > 1 ? "s" : ""} · {g.photos} photo
                      {g.photos > 1 ? "s" : ""}
                    </div>
                  </div>
                  <span className="badge bg-surface-raised text-primary">
                    {g.score}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Suivi de la charge Vercel Blob */}
      <section className="card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-fg">Stockage photos (Vercel Blob)</h2>
            <p className="mt-1 text-sm text-muted">
              {photoCount} photo{photoCount > 1 ? "s" : ""} en base — estimation{" "}
              <span className="font-semibold text-fg">{formatBytes(estimatedBytes)}</span>{" "}
              (~3 Mo/photo).
            </p>
          </div>
          <span className="badge bg-surface-raised text-muted">Plan Hobby · 1 Go</span>
        </div>

        <div className="mt-4">
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-raised">
            <div
              className={`h-full rounded-full ${quotaColor} transition-all`}
              style={{ width: `${quotaPct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>{quotaPct}% du quota Hobby estimé</span>
            <span>{formatBytes(estimatedBytes)} / 1 Go</span>
          </div>
        </div>

        <p className="mt-3 text-xs text-subtle">
          Estimation indicative. Le volume réel dépend de la taille effective des
          fichiers ; les photos sont purgées 7 jours après la sortie par le cron
          quotidien.
        </p>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="mt-2 text-3xl font-extrabold text-fg">{value}</div>
    </div>
  );
}
