import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import ReportedCommentCard, {
  type ReportedComment,
} from "@/app/components/ReportedCommentCard";

export const dynamic = "force-dynamic";

/**
 * Tous les signalements ouverts (= non encore traités), groupés par commentaire.
 * Un commentaire peut être signalé par plusieurs personnes (1 report par
 * couple commentId/reporterId, cf. @@unique du schéma).
 */
async function getReportedComments(): Promise<ReportedComment[]> {
  const reports = await prisma.commentReport.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      comment: {
        include: {
          author: { select: { id: true, name: true } },
          event: {
            select: {
              id: true,
              name: true,
              group: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  // Regroupement par commentId.
  const byComment = new Map<string, ReportedComment>();
  for (const r of reports) {
    const c = r.comment;
    if (!byComment.has(c.id)) {
      byComment.set(c.id, {
        commentId: c.id,
        text: c.text,
        authorName: c.author.name,
        authorId: c.author.id,
        createdLabel: formatDateTime(c.createdAt),
        eventName: c.event.name,
        groupName: c.event.group?.name ?? null,
        groupId: c.event.group?.id ?? null,
        reports: [],
      });
    }
    byComment.get(c.id)!.reports.push({
      id: r.id,
      reporterName: r.reporter.name,
      reporterEmail: r.reporter.email,
      reason: r.reason,
      createdLabel: formatDateTime(r.createdAt),
    });
  }

  // Tri : le plus signalé en premier, puis le plus récent.
  return Array.from(byComment.values()).sort((a, b) => {
    if (b.reports.length !== a.reports.length)
      return b.reports.length - a.reports.length;
    return b.reports[0].createdLabel.localeCompare(a.reports[0].createdLabel);
  });
}

export default async function ReportsPage() {
  const items = await getReportedComments();
  const totalReports = items.reduce((acc, c) => acc + c.reports.length, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-fg">
          Commentaires signalés
        </h1>
        <p className="mt-1 text-sm text-muted">
          Modération UGC — conformité DSA.
          {items.length > 0 && (
            <>
              {" "}
              <span className="font-semibold text-fg">
                {items.length} commentaire{items.length > 1 ? "s" : ""}
              </span>{" "}
              · {totalReports} signalement{totalReports > 1 ? "s" : ""} en
              attente.
            </>
          )}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-12 text-center">
          <span className="text-3xl">✨</span>
          <p className="text-sm font-semibold text-fg">
            Aucun signalement en attente.
          </p>
          <p className="text-xs text-muted">Tout est calme côté modération.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((c) => (
            <ReportedCommentCard key={c.commentId} data={c} />
          ))}
        </div>
      )}
    </div>
  );
}
