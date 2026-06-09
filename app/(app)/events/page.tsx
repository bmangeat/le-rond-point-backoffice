import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import EventsTable from "@/app/components/EventsTable";

export const dynamic = "force-dynamic";

async function getEvents() {
  return prisma.event.findMany({
    orderBy: { whenAt: "desc" },
    select: {
      id: true,
      name: true,
      type: true,
      whenAt: true,
      cancelledAt: true,
      groupId: true,
      group: { select: { name: true } },
      host: { select: { name: true } },
      _count: { select: { rsvps: true } },
      rsvps: { where: { status: "YES" }, select: { id: true } },
    },
  });
}

export default async function EventsPage() {
  const events = await getEvents();
  const cancelled = events.filter((e) => e.cancelledAt).length;

  const rows = events.map((e) => ({
    id: e.id,
    name: e.name,
    type: e.type,
    whenLabel: formatDateTime(e.whenAt),
    whenAt: e.whenAt.toISOString(),
    groupName: e.group?.name ?? null,
    groupId: e.groupId,
    hostName: e.host.name,
    cancelled: e.cancelledAt !== null,
    yesCount: e.rsvps.length,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-fg">Sorties</h1>
        <p className="mt-1 text-sm text-muted">
          Toutes les sorties, tous groupes confondus.
          {cancelled > 0 && ` · ${cancelled} annulée${cancelled > 1 ? "s" : ""}.`}
        </p>
      </header>

      <EventsTable events={rows} />
    </div>
  );
}
