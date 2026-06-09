import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Quota Vercel Blob (rappel visuel pour éviter les surprises de facturation).
// Hobby = 1 Go inclus ; Pro = 100 Go. On estime ~3 Mo / photo (moyenne mobile).
const BLOB_AVG_PHOTO_BYTES = 3 * 1024 * 1024;
const BLOB_HOBBY_QUOTA_BYTES = 1 * 1024 * 1024 * 1024; // 1 Go

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

async function getDashboardData() {
  const [groupCount, activeUserCount, eventsThisMonth, photoCount] =
    await Promise.all([
      prisma.group.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.event.count({
        where: {
          whenAt: { gte: startOfMonthUTC(), lt: startOfNextMonthUTC() },
          cancelledAt: null,
        },
      }),
      prisma.eventPhoto.count(),
    ]);

  return { groupCount, activeUserCount, eventsThisMonth, photoCount };
}

export default async function DashboardPage() {
  const { groupCount, activeUserCount, eventsThisMonth, photoCount } =
    await getDashboardData();

  const estimatedBytes = photoCount * BLOB_AVG_PHOTO_BYTES;
  const quotaPct = Math.min(
    100,
    Math.round((estimatedBytes / BLOB_HOBBY_QUOTA_BYTES) * 100),
  );
  const quotaColor =
    quotaPct >= 90 ? "bg-destructive" : quotaPct >= 70 ? "bg-busy" : "bg-available";

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
