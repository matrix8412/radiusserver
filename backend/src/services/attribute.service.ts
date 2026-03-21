import pool from '../db/pool';
import { RadCheck, RadReply, RadGroupCheck, RadGroupReply, PaginatedResult, PaginationParams } from '../types';
import { sanitizeSearchQuery } from '../utils/validators';

// ---- Check Attributes ----

export async function getCheckAttributes(params: PaginationParams): Promise<PaginatedResult<RadCheck>> {
  const { page, limit, search } = params;
  const offset = (page - 1) * limit;
  const queryParams: unknown[] = [];
  let whereClause = '';

  if (search) {
    const safe = sanitizeSearchQuery(search);
    whereClause = 'WHERE username ILIKE $1 OR attribute ILIKE $1';
    queryParams.push(`%${safe}%`);
  }

  const countResult = await pool.query(`SELECT COUNT(*) FROM radcheck ${whereClause}`, queryParams);
  const total = parseInt(countResult.rows[0].count, 10);

  const paramOffset = queryParams.length;
  queryParams.push(limit, offset);

  const result = await pool.query<RadCheck>(
    `SELECT * FROM radcheck ${whereClause} ORDER BY username, id LIMIT $${paramOffset + 1} OFFSET $${paramOffset + 2}`,
    queryParams,
  );

  return { data: result.rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getCheckAttributesByUsername(username: string): Promise<RadCheck[]> {
  const result = await pool.query<RadCheck>(
    'SELECT * FROM radcheck WHERE username = $1 ORDER BY id',
    [username],
  );
  return result.rows;
}

export async function createCheckAttribute(data: {
  username: string;
  attribute: string;
  op: string;
  value: string;
}): Promise<RadCheck> {
  const result = await pool.query<RadCheck>(
    'INSERT INTO radcheck (username, attribute, op, value) VALUES ($1, $2, $3, $4) RETURNING *',
    [data.username, data.attribute, data.op, data.value],
  );
  return result.rows[0];
}

export async function updateCheckAttribute(id: number, data: {
  attribute?: string;
  op?: string;
  value?: string;
}): Promise<RadCheck | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.attribute !== undefined) { fields.push(`attribute = $${idx++}`); values.push(data.attribute); }
  if (data.op !== undefined) { fields.push(`op = $${idx++}`); values.push(data.op); }
  if (data.value !== undefined) { fields.push(`value = $${idx++}`); values.push(data.value); }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await pool.query<RadCheck>(
    `UPDATE radcheck SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values,
  );
  return result.rows[0] || null;
}

export async function deleteCheckAttribute(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM radcheck WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// ---- Reply Attributes ----

export async function getReplyAttributes(params: PaginationParams): Promise<PaginatedResult<RadReply>> {
  const { page, limit, search } = params;
  const offset = (page - 1) * limit;
  const queryParams: unknown[] = [];
  let whereClause = '';

  if (search) {
    const safe = sanitizeSearchQuery(search);
    whereClause = 'WHERE username ILIKE $1 OR attribute ILIKE $1';
    queryParams.push(`%${safe}%`);
  }

  const countResult = await pool.query(`SELECT COUNT(*) FROM radreply ${whereClause}`, queryParams);
  const total = parseInt(countResult.rows[0].count, 10);

  const paramOffset = queryParams.length;
  queryParams.push(limit, offset);

  const result = await pool.query<RadReply>(
    `SELECT * FROM radreply ${whereClause} ORDER BY username, id LIMIT $${paramOffset + 1} OFFSET $${paramOffset + 2}`,
    queryParams,
  );

  return { data: result.rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getReplyAttributesByUsername(username: string): Promise<RadReply[]> {
  const result = await pool.query<RadReply>(
    'SELECT * FROM radreply WHERE username = $1 ORDER BY id',
    [username],
  );
  return result.rows;
}

export async function createReplyAttribute(data: {
  username: string;
  attribute: string;
  op: string;
  value: string;
}): Promise<RadReply> {
  const result = await pool.query<RadReply>(
    'INSERT INTO radreply (username, attribute, op, value) VALUES ($1, $2, $3, $4) RETURNING *',
    [data.username, data.attribute, data.op, data.value],
  );
  return result.rows[0];
}

export async function updateReplyAttribute(id: number, data: {
  attribute?: string;
  op?: string;
  value?: string;
}): Promise<RadReply | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.attribute !== undefined) { fields.push(`attribute = $${idx++}`); values.push(data.attribute); }
  if (data.op !== undefined) { fields.push(`op = $${idx++}`); values.push(data.op); }
  if (data.value !== undefined) { fields.push(`value = $${idx++}`); values.push(data.value); }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await pool.query<RadReply>(
    `UPDATE radreply SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values,
  );
  return result.rows[0] || null;
}

export async function deleteReplyAttribute(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM radreply WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// ---- Group Check Attributes ----

export async function getGroupCheckAttributes(groupname: string): Promise<RadGroupCheck[]> {
  const result = await pool.query<RadGroupCheck>(
    'SELECT * FROM radgroupcheck WHERE groupname = $1 ORDER BY id',
    [groupname],
  );
  return result.rows;
}

export async function createGroupCheckAttribute(data: {
  groupname: string;
  attribute: string;
  op: string;
  value: string;
}): Promise<RadGroupCheck> {
  const result = await pool.query<RadGroupCheck>(
    'INSERT INTO radgroupcheck (groupname, attribute, op, value) VALUES ($1, $2, $3, $4) RETURNING *',
    [data.groupname, data.attribute, data.op, data.value],
  );
  return result.rows[0];
}

export async function deleteGroupCheckAttribute(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM radgroupcheck WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// ---- Group Reply Attributes ----

export async function getGroupReplyAttributes(groupname: string): Promise<RadGroupReply[]> {
  const result = await pool.query<RadGroupReply>(
    'SELECT * FROM radgroupreply WHERE groupname = $1 ORDER BY id',
    [groupname],
  );
  return result.rows;
}

export async function createGroupReplyAttribute(data: {
  groupname: string;
  attribute: string;
  op: string;
  value: string;
}): Promise<RadGroupReply> {
  const result = await pool.query<RadGroupReply>(
    'INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES ($1, $2, $3, $4) RETURNING *',
    [data.groupname, data.attribute, data.op, data.value],
  );
  return result.rows[0];
}

export async function deleteGroupReplyAttribute(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM radgroupreply WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
