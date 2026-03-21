import pool from '../db/pool';
import { RadPostAuth, RadAcct, PaginatedResult, PaginationParams } from '../types';
import { sanitizeSearchQuery } from '../utils/validators';

export async function getAuthLogs(
  params: PaginationParams & { username?: string; reply?: string; dateFrom?: string; dateTo?: string },
): Promise<PaginatedResult<RadPostAuth>> {
  const { page, limit, search, username, reply, dateFrom, dateTo } = params;
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const queryParams: unknown[] = [];
  let idx = 1;

  if (search) {
    const safe = sanitizeSearchQuery(search);
    conditions.push(`(username ILIKE $${idx})`);
    queryParams.push(`%${safe}%`);
    idx++;
  }
  if (username) {
    conditions.push(`username = $${idx}`);
    queryParams.push(username);
    idx++;
  }
  if (reply) {
    conditions.push(`reply = $${idx}`);
    queryParams.push(reply);
    idx++;
  }
  if (dateFrom) {
    conditions.push(`authdate >= $${idx}::timestamptz`);
    queryParams.push(dateFrom);
    idx++;
  }
  if (dateTo) {
    conditions.push(`authdate <= $${idx}::timestamptz`);
    queryParams.push(dateTo);
    idx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pool.query(`SELECT COUNT(*) FROM radpostauth ${whereClause}`, queryParams);
  const total = parseInt(countResult.rows[0].count, 10);

  queryParams.push(limit, offset);
  const result = await pool.query<RadPostAuth>(
    `SELECT id, username, pass, reply, authdate, class
     FROM radpostauth ${whereClause}
     ORDER BY authdate DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    queryParams,
  );

  return { data: result.rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getAccountingLogs(
  params: PaginationParams & {
    username?: string;
    nasipaddress?: string;
    dateFrom?: string;
    dateTo?: string;
    activeOnly?: boolean;
  },
): Promise<PaginatedResult<RadAcct>> {
  const { page, limit, search, username, nasipaddress, dateFrom, dateTo, activeOnly } = params;
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const queryParams: unknown[] = [];
  let idx = 1;

  if (search) {
    const safe = sanitizeSearchQuery(search);
    conditions.push(`(username ILIKE $${idx} OR nasipaddress ILIKE $${idx} OR framedipaddress ILIKE $${idx})`);
    queryParams.push(`%${safe}%`);
    idx++;
  }
  if (username) {
    conditions.push(`username = $${idx}`);
    queryParams.push(username);
    idx++;
  }
  if (nasipaddress) {
    conditions.push(`nasipaddress = $${idx}`);
    queryParams.push(nasipaddress);
    idx++;
  }
  if (dateFrom) {
    conditions.push(`acctstarttime >= $${idx}::timestamptz`);
    queryParams.push(dateFrom);
    idx++;
  }
  if (dateTo) {
    conditions.push(`acctstarttime <= $${idx}::timestamptz`);
    queryParams.push(dateTo);
    idx++;
  }
  if (activeOnly) {
    conditions.push('acctstoptime IS NULL');
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pool.query(`SELECT COUNT(*) FROM radacct ${whereClause}`, queryParams);
  const total = parseInt(countResult.rows[0].count, 10);

  queryParams.push(limit, offset);
  const result = await pool.query<RadAcct>(
    `SELECT * FROM radacct ${whereClause}
     ORDER BY acctstarttime DESC NULLS LAST
     LIMIT $${idx} OFFSET $${idx + 1}`,
    queryParams,
  );

  return { data: result.rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function purgeAuthLogs(retentionDays: number): Promise<number> {
  const result = await pool.query(
    `DELETE FROM radpostauth WHERE authdate < NOW() - INTERVAL '1 day' * $1`,
    [retentionDays],
  );
  return result.rowCount ?? 0;
}

export async function purgeAcctLogs(retentionDays: number): Promise<number> {
  const result = await pool.query(
    `DELETE FROM radacct WHERE acctstarttime < NOW() - INTERVAL '1 day' * $1 AND acctstoptime IS NOT NULL`,
    [retentionDays],
  );
  return result.rowCount ?? 0;
}
