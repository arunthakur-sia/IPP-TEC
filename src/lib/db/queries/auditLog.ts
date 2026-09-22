import { getSupabase, unwrap } from "@/lib/supabase/client";
import type { AuditLogEntry } from "@/lib/types/domain";

export async function logAction(entry: {
  entityType: AuditLogEntry["entityType"];
  entityId: string;
  actorId: string;
  action: string;
  detail: string;
}): Promise<void> {
  const db = getSupabase();
  const { error } = await db.from("audit_log").insert({
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    actor_id: entry.actorId,
    action: entry.action,
    detail: entry.detail,
  });
  if (error) throw new Error(`Supabase error: ${error.message}`);
}

export async function listAuditLog(entityType: AuditLogEntry["entityType"], entityId: string): Promise<AuditLogEntry[]> {
  const db = getSupabase();
  const rows = unwrap(
    await db
      .from("audit_log")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
  ) as {
    id: string;
    entity_type: AuditLogEntry["entityType"];
    entity_id: string;
    actor_id: string;
    action: string;
    detail: string;
    created_at: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    actorId: r.actor_id,
    action: r.action,
    detail: r.detail,
    createdAt: r.created_at,
  }));
}
