import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import AuditTable from "@/app/components/AuditTable";

export const dynamic = "force-dynamic";

async function getLogs() {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      createdAt: true,
      actorEmail: true,
      action: true,
      targetType: true,
      targetId: true,
      groupId: true,
      reason: true,
      metadata: true,
    },
  });
}

export default async function AuditPage() {
  const logs = await getLogs();

  const rows = logs.map((l) => ({
    id: l.id,
    createdLabel: formatDateTime(l.createdAt),
    actorEmail: l.actorEmail,
    action: l.action,
    targetType: l.targetType,
    targetId: l.targetId,
    groupId: l.groupId,
    reason: l.reason,
    metadata: (l.metadata as Record<string, unknown> | null) ?? null,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-fg">Journal d&apos;audit</h1>
        <p className="mt-1 text-sm text-muted">
          Traçabilité des actions sensibles des Super Admins (accountability RGPD).
          Append-only.
        </p>
      </header>

      <AuditTable rows={rows} />
    </div>
  );
}
