import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Catalogue des actions tracées (constantes pour éviter les fautes de frappe).
export const AUDIT = {
  USER_ANONYMIZED: "USER_ANONYMIZED",
  USER_DEACTIVATED: "USER_DEACTIVATED",
  USER_REACTIVATED: "USER_REACTIVATED",
  USER_ASSIGNED_GROUP: "USER_ASSIGNED_GROUP",
  USER_REMOVED_GROUP: "USER_REMOVED_GROUP",
  ROLE_CHANGED: "ROLE_CHANGED",
  GROUP_CREATED: "GROUP_CREATED",
  INVITATION_GENERATED: "INVITATION_GENERATED",
  INVITATION_DELETED: "INVITATION_DELETED",
  COMMENT_DELETED: "COMMENT_DELETED",
  REPORTS_DISMISSED: "REPORTS_DISMISSED",
  EVENT_CANCELLED: "EVENT_CANCELLED",
  EVENT_RESTORED: "EVENT_RESTORED",
  BROADCAST_SENT: "BROADCAST_SENT",
} as const;

export type AuditAction = (typeof AUDIT)[keyof typeof AUDIT];

type Actor = { id: string; email: string };

export async function logAudit(
  actor: Actor,
  action: AuditAction,
  target: { type: string; id: string },
  opts?: {
    groupId?: string | null;
    reason?: string | null;
    metadata?: Prisma.InputJsonValue;
  },
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        action,
        targetType: target.type,
        targetId: target.id,
        groupId: opts?.groupId ?? null,
        reason: opts?.reason ?? null,
        metadata: opts?.metadata,
      },
    });
  } catch (e) {
    // Le journal ne doit JAMAIS faire échouer l'action métier.
    console.error("audit log failed:", (e as Error).message);
  }
}
