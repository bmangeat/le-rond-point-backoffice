import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { EVENT_TYPE_META } from "@/lib/events";
import EventStatusActions from "@/app/components/EventStatusActions";

export const dynamic = "force-dynamic";

async function getEvent(id: string) {
  return prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      description: true,
      whenAt: true,
      placeName: true,
      placeAddr: true,
      needsEnabled: true,
      tricountEnabled: true,
      hasPlaylist: true,
      playlistUrl: true,
      cancelledAt: true,
      cancelReason: true,
      createdAt: true,
      hostId: true,
      host: { select: { id: true, name: true } },
      groupId: true,
      group: { select: { name: true } },
      _count: {
        select: { needs: true, comments: true, photos: true },
      },
      rsvps: { select: { status: true } },
      expenses: { select: { amount: true } },
    },
  });
}

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const event = await getEvent(params.id);
  if (!event) notFound();

  const yes = event.rsvps.filter((r) => r.status === "YES").length;
  const no = event.rsvps.filter((r) => r.status === "NO").length;
  const pending = event.rsvps.filter((r) => r.status === "PENDING").length;
  const totalExpenses = event.expenses.reduce((a, e) => a + e.amount, 0);
  const meta = EVENT_TYPE_META[event.type];

  return (
    <div className="space-y-6">
      <Link
        href="/events"
        className="text-sm font-semibold text-muted hover:text-fg"
      >
        ← Toutes les sorties
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-fg">{event.name}</h1>
            <span className={`badge ${meta?.badge ?? ""}`}>
              {meta?.label ?? event.type}
            </span>
            {event.cancelledAt && (
              <span className="badge bg-destructive/10 text-destructive">
                Annulée
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            {formatDateTime(event.whenAt)} · {event.placeName}
            {event.placeAddr ? ` — ${event.placeAddr}` : ""}
          </p>
        </div>
      </header>

      {/* Méta */}
      <section className="card">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <Field label="Hôte">
            <Link
              href={`/users/${event.hostId}`}
              className="font-semibold text-primary hover:underline"
            >
              {event.host.name}
            </Link>
          </Field>
          <Field label="Groupe">
            {event.groupId ? (
              <Link
                href={`/groups/${event.groupId}`}
                className="font-semibold text-primary hover:underline"
              >
                {event.group?.name}
              </Link>
            ) : (
              "—"
            )}
          </Field>
          <Field label="Créée le">{formatDateTime(event.createdAt)}</Field>
          <Field label="Options">
            {[
              event.needsEnabled && "Besoins",
              event.tricountEnabled && "Tricount",
              event.hasPlaylist && "Playlist",
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
          </Field>
        </dl>
        {event.description && (
          <p className="mt-4 whitespace-pre-wrap border-t border-border pt-4 text-sm text-fg">
            {event.description}
          </p>
        )}
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Oui" value={yes} tone="ok" />
        <Stat label="Non" value={no} />
        <Stat label="En attente" value={pending} />
        <Stat label="Besoins" value={event._count.needs} />
        <Stat label="Commentaires" value={event._count.comments} />
        <Stat label="Photos" value={event._count.photos} />
      </section>

      {event.tricountEnabled && (
        <section className="card">
          <div className="text-sm font-semibold text-muted">
            Dépenses (Tricount)
          </div>
          <div className="mt-1 text-2xl font-extrabold text-fg">
            {totalExpenses.toFixed(2)} €
          </div>
          <div className="text-xs text-subtle">
            {event.expenses.length} dépense{event.expenses.length > 1 ? "s" : ""}
          </div>
        </section>
      )}

      {/* Action annuler / restaurer */}
      <EventStatusActions
        eventId={event.id}
        cancelled={event.cancelledAt !== null}
        cancelReason={event.cancelReason}
      />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-subtle">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-fg">{children}</dd>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok";
}) {
  return (
    <div className="card text-center">
      <div
        className={`text-2xl font-extrabold ${tone === "ok" ? "text-available" : "text-fg"}`}
      >
        {value}
      </div>
      <div className="text-xs font-semibold text-muted">{label}</div>
    </div>
  );
}
