import { auditLogs, requestHistory } from "@/db/schema";
import type { RequestStatus } from "@/lib/constants";

export type AuditInput = {
  requestId?: string;
  itemId?: string;
  actorName: string;
  actorRole?: "Admin" | "Employee" | "System";
  action: string;
  fromStatus?: RequestStatus;
  toStatus?: RequestStatus;
  note?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
};

type AuditDb = {
  insert: typeof import("@/db").db.insert;
};

export async function createAuditLog(db: AuditDb, input: AuditInput) {
  const [auditLog] = await db
    .insert(auditLogs)
    .values({
      requestId: input.requestId,
      itemId: input.itemId,
      actorName: input.actorName,
      action: input.action,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      metadata: input.metadata ?? {},
      createdAt: input.createdAt,
    })
    .returning();

  if (input.requestId) {
    await db.insert(requestHistory).values({
      requestId: input.requestId,
      actorName: input.actorName,
      actorRole: input.actorRole ?? "System",
      action: input.action,
      note: input.note,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      metadata: input.metadata ?? {},
      createdAt: input.createdAt,
    });
  }

  return auditLog;
}
