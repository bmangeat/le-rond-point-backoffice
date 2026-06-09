import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/format";
import { buildInviteUrl } from "@/lib/invite";
import MemberRow from "@/app/components/MemberRow";
import InvitationsCard from "@/app/components/InvitationsCard";

export const dynamic = "force-dynamic";

async function getGroup(id: string) {
  return prisma.group.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, events: true } },
      users: {
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
  });
}

// Tous les liens d'invitation actifs (non utilisés, non expirés) du groupe.
async function getActiveInvites(groupId: string) {
  return prisma.invitation.findMany({
    where: { groupId, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { id: true, token: true, expiresAt: true },
  });
}

export default async function GroupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const group = await getGroup(params.id);
  if (!group) notFound();

  const activeInvites = await getActiveInvites(group.id);
  const invites = activeInvites.map((inv) => ({
    id: inv.id,
    url: buildInviteUrl(inv.token),
    expiresLabel: formatDateTime(inv.expiresAt),
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/groups"
        className="text-sm font-semibold text-muted hover:text-fg"
      >
        ← Tous les groupes
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">{group.name}</h1>
          <p className="mt-1 text-sm text-muted">
            Créé le {formatDate(group.createdAt)} ·{" "}
            <span className="font-mono text-xs">{group.id}</span>
          </p>
        </div>
        <div className="flex gap-4">
          <Stat label="Membres" value={group._count.users} />
          <Stat label="Sorties" value={group._count.events} />
        </div>
      </header>

      <InvitationsCard groupId={group.id} invites={invites} />

      <div className="card overflow-hidden p-0">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-bold text-fg">Membres du groupe</h2>
          <p className="text-xs text-muted">
            Promouvoir un membre au rang d&apos;Admin met à jour son rôle en base.
          </p>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-subtle">
              <th className="px-5 py-3">Membre</th>
              <th className="px-5 py-3">Inscrit le</th>
              <th className="px-5 py-3">Rôle</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {group.users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-muted">
                  Aucun membre dans ce groupe.
                </td>
              </tr>
            )}
            {group.users.map((m) => (
              <MemberRow
                key={m.id}
                groupId={group.id}
                member={{ ...m, createdAt: m.createdAt.toISOString() }}
              />
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised px-4 py-2 text-center">
      <div className="text-xl font-extrabold text-fg">{value}</div>
      <div className="text-xs font-semibold text-muted">{label}</div>
    </div>
  );
}
