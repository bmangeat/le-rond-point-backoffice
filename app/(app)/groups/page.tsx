import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import CreateGroupModal from "@/app/components/CreateGroupModal";
import OrphanUsers from "@/app/components/OrphanUsers";

export const dynamic = "force-dynamic";

async function getGroups() {
  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true } },
      // Admin(s) locaux du groupe (souvent un seul) pour la colonne "Admin principal".
      users: {
        where: { role: "ADMIN", isActive: true },
        select: { name: true, email: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });
  return groups;
}

// Comptes sans groupe (groupId null) — actifs uniquement, à rattacher.
async function getOrphans() {
  return prisma.user.findMany({
    where: { groupId: null, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true },
  });
}

export default async function GroupsPage() {
  const [groups, orphans] = await Promise.all([getGroups(), getOrphans()]);
  const groupOptions = groups.map((g) => ({ id: g.id, name: g.name }));

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">Groupes</h1>
          <p className="mt-1 text-sm text-muted">
            {groups.length} Rond Point{groups.length > 1 ? "s" : ""} au total.
          </p>
        </div>
        <CreateGroupModal />
      </header>

      <OrphanUsers orphans={orphans} groups={groupOptions} />

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-subtle">
              <th className="px-5 py-3">Groupe</th>
              <th className="px-5 py-3">Créé le</th>
              <th className="px-5 py-3">Membres</th>
              <th className="px-5 py-3">Admin principal</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted">
                  Aucun groupe pour l&apos;instant.
                </td>
              </tr>
            )}
            {groups.map((g) => {
              const admin = g.users[0];
              return (
                <tr
                  key={g.id}
                  className="border-b border-border last:border-0 hover:bg-surface-raised/50"
                >
                  <td className="px-5 py-3.5 font-semibold text-fg">{g.name}</td>
                  <td className="px-5 py-3.5 text-muted">{formatDate(g.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <span className="badge bg-surface-raised text-primary">
                      {g._count.users}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {admin ? (
                      <div className="leading-tight">
                        <div className="font-medium text-fg">{admin.name}</div>
                        <div className="text-xs text-muted">{admin.email}</div>
                      </div>
                    ) : (
                      <span className="text-subtle">— aucun admin —</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/groups/${g.id}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Détails →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
