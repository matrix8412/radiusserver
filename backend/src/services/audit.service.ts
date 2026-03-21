import pool from '../db/pool';
import { AuditLogEntry, PaginatedResult, PaginationParams } from '../types';
import { sanitizeSearchQuery } from '../utils/validators';

export async function getAuditLogs(
  params: PaginationParams & { action?: string; entityType?: string; adminId?: number; dateFrom?: string; dateTo?: string },
): Promise<PaginatedResult<AuditLogEntry>> {
  const { page, limit, search, action, entityType, adminId, dateFrom, dateTo } = params;
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const queryParams: unknown[] = [];
  let idx = 1;

  if (search) {
    const safe = sanitizeSearchQuery(search);
    conditions.push(`(admin_username ILIKE $${idx} OR action ILIKE $${idx} OR entity_type ILIKE $${idx})`);
    queryParams.push(`%${safe}%`);
    idx++;
  }
  if (action) {
    conditions.push(`action = $${idx}`);
    queryParams.push(action);
    idx++;
  }
  if (entityType) {
    conditions.push(`entity_type = $${idx}`);
    queryParams.push(entityType);
    idx++;
  }
  if (adminId) {
    conditions.push(`admin_id = $${idx}`);
    queryParams.push(adminId);
    idx++;
  }
  if (dateFrom) {
    conditions.push(`created_at >= $${idx}::timestamptz`);
    queryParams.push(dateFrom);
    idx++;
  }
  if (dateTo) {
    conditions.push(`created_at <= $${idx}::timestamptz`);
    queryParams.push(dateTo);
    idx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pool.query(`SELECT COUNT(*) FROM audit_log ${whereClause}`, queryParams);
  const total = parseInt(countResult.rows[0].count, 10);

  queryParams.push(limit, offset);
  const result = await pool.query<AuditLogEntry>(
    `SELECT * FROM audit_log ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    queryParams,
  );

  return { data: result.rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
