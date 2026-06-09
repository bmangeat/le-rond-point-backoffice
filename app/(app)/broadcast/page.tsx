import { prisma } from "@/lib/prisma";
import { isPushConfigured } from "@/lib/push";
import BroadcastForm from "@/app/components/BroadcastForm";

export const dynamic = "force-dynamic";

async function getReach() {
  const [subs, reachableUsers, groups] = await Promise.all([
    prisma.pushSubscription.count(),
    prisma.user.count({
      where: { isActive: true, notifPush: true, pushSubscriptions: { some: {} } },
    }),
    prisma.group.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return { subs, reachableUsers, groups };
}

export default async function BroadcastPage() {
  const { subs, reachableUsers, groups } = await getReach();
  const pushConfigured = isPushConfigured();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-fg">Broadcast push</h1>
        <p className="mt-1 text-sm text-muted">
          Envoie une notification push aux utilisateurs de l&apos;app le-rond-point.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="text-2xl font-extrabold text-fg">{subs}</div>
          <div className="text-xs font-semibold text-muted">
            Abonnements (devices)
          </div>
        </div>
        <div className="card">
          <div className="text-2xl font-extrabold text-fg">{reachableUsers}</div>
          <div className="text-xs font-semibold text-muted">
            Utilisateurs joignables
          </div>
        </div>
        <div className="card">
          <div
            className={`text-sm font-bold ${pushConfigured ? "text-available" : "text-busy"}`}
          >
            {pushConfigured ? "✓ VAPID OK" : "⚠️ VAPID manquant"}
          </div>
          <div className="text-xs font-semibold text-muted">Config push</div>
        </div>
      </section>

      <BroadcastForm groups={groups} pushConfigured={pushConfigured} />
    </div>
  );
}
