import pool from '../db/pool';
import { NasDevice, PaginatedResult, PaginationParams } from '../types';
import { sanitizeSearchQuery } from '../utils/validators';

export async function getNasDevices(params: PaginationParams): Promise<PaginatedResult<NasDevice>> {
  const { page, limit, search } = params;
  const offset = (page - 1) * limit;
  const queryParams: unknown[] = [];
  let whereClause = '';

  if (search) {
    const safe = sanitizeSearchQuery(search);
    whereClause = 'WHERE nasname ILIKE $1 OR shortname ILIKE $1 OR description ILIKE $1';
    queryParams.push(`%${safe}%`);
  }

  const countResult = await pool.query(`SELECT COUNT(*) FROM nas ${whereClause}`, queryParams);
  const total = parseInt(countResult.rows[0].count, 10);

  const paramOffset = queryParams.length;
  queryParams.push(limit, offset);

  const result = await pool.query<NasDevice>(
    `SELECT * FROM nas ${whereClause} ORDER BY id LIMIT $${paramOffset + 1} OFFSET $${paramOffset + 2}`,
    queryParams,
  );

  return { data: result.rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getNasById(id: number): Promise<NasDevice | null> {
  const result = await pool.query<NasDevice>('SELECT * FROM nas WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createNas(data: {
  nasname: string;
  shortname?: string;
  type?: string;
  ports?: number;
  secret: string;
  server?: string;
  community?: string;
  description?: string;
}): Promise<NasDevice> {
  const result = await pool.query<NasDevice>(
    `INSERT INTO nas (nasname, shortname, type, ports, secret, server, community, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      data.nasname,
      data.shortname || null,
      data.type || 'other',
      data.ports || null,
      data.secret,
      data.server || null,
      data.community || null,
      data.description || null,
    ],
  );
  return result.rows[0];
}

export async function updateNas(id: number, data: {
  nasname?: string;
  shortname?: string;
  type?: string;
  ports?: number;
  secret?: string;
  server?: string;
  community?: string;
  description?: string;
}): Promise<NasDevice | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.nasname !== undefined) { fields.push(`nasname = $${idx++}`); values.push(data.nasname); }
  if (data.shortname !== undefined) { fields.push(`shortname = $${idx++}`); values.push(data.shortname); }
  if (data.type !== undefined) { fields.push(`type = $${idx++}`); values.push(data.type); }
  if (data.ports !== undefined) { fields.push(`ports = $${idx++}`); values.push(data.ports); }
  if (data.secret !== undefined) { fields.push(`secret = $${idx++}`); values.push(data.secret); }
  if (data.server !== undefined) { fields.push(`server = $${idx++}`); values.push(data.server); }
  if (data.community !== undefined) { fields.push(`community = $${idx++}`); values.push(data.community); }
  if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }

  if (fields.length === 0) return getNasById(id);

  values.push(id);
  await pool.query(`UPDATE nas SET ${fields.join(', ')} WHERE id = $${idx}`, values);
  return getNasById(id);
}

export async function deleteNas(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM nas WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
