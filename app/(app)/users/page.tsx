import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import UsersTable from "@/app/components/UsersTable";

export const dynamic = "force-dynamic";

async function getUsers() {
  return prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      groupId: true,
      createdAt: true,
      group: { select: { name: true } },
    },
  });
}

export default async function UsersPage() {
  const users = await getUsers();

  const rows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    groupId: u.groupId,
    groupName: u.group?.name ?? null,
    createdLabel: formatDate(u.createdAt),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-fg">Utilisateurs</h1>
        <p className="mt-1 text-sm text-muted">
          Tous les comptes, tous groupes confondus.
        </p>
      </header>

      <UsersTable users={rows} />
    </div>
  );
}
