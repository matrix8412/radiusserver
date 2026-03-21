import pool from '../db/pool';
import { RadiusUser, PaginatedResult, PaginationParams } from '../types';
import { formatRadiusPassword } from '../utils/password';
import { sanitizeSearchQuery } from '../utils/validators';

export async function getUsers(params: PaginationParams): Promise<PaginatedResult<RadiusUser>> {
  const { page, limit, search, sortBy = 'id', sortOrder = 'asc' } = params;
  const offset = (page - 1) * limit;

  const allowedSorts = ['id', 'username', 'display_name', 'email', 'enabled', 'created_at'];
  const sort = allowedSorts.includes(sortBy) ? sortBy : 'id';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

  let whereClause = '';
  const queryParams: unknown[] = [];

  if (search) {
    const safe = sanitizeSearchQuery(search);
    whereClause = `WHERE username ILIKE $1 OR display_name ILIKE $1 OR email ILIKE $1`;
    queryParams.push(`%${safe}%`);
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM radius_users ${whereClause}`,
    queryParams,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const paramOffset = queryParams.length;
  queryParams.push(limit, offset);

  const result = await pool.query<RadiusUser>(
    `SELECT id, username, display_name, email, enabled, totp_enabled, totp_verified,
            force_password_reset, notes, created_at, updated_at
     FROM radius_users ${whereClause}
     ORDER BY ${sort} ${order}
     LIMIT $${paramOffset + 1} OFFSET $${paramOffset + 2}`,
    queryParams,
  );

  return {
    data: result.rows,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getUserById(id: number): Promise<RadiusUser | null> {
  const result = await pool.query<RadiusUser>(
    `SELECT id, username, display_name, email, enabled, totp_enabled, totp_verified,
            force_password_reset, notes, created_at, updated_at
     FROM radius_users WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function getUserByUsername(username: string): Promise<RadiusUser | null> {
  const result = await pool.query<RadiusUser>(
    `SELECT id, username, display_name, email, enabled, totp_enabled, totp_verified,
            force_password_reset, notes, created_at, updated_at
     FROM radius_users WHERE username = $1`,
    [username],
  );
  return result.rows[0] || null;
}

export async function createUser(data: {
  username: string;
  password: string;
  display_name?: string;
  email?: string;
  enabled?: boolean;
}): Promise<RadiusUser> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create in radius_users
    const userResult = await client.query<RadiusUser>(
      `INSERT INTO radius_users (username, display_name, email, enabled)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.username, data.display_name || null, data.email || null, data.enabled !== false],
    );

    // Create password in radcheck (Cleartext-Password for PAP)
    const radiusPass = formatRadiusPassword(data.password);
    await client.query(
      `INSERT INTO radcheck (username, attribute, op, value)
       VALUES ($1, 'Cleartext-Password', ':=', $2)`,
      [data.username, radiusPass],
    );

    await client.query('COMMIT');
    return userResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateUser(
  id: number,
  data: { display_name?: string; email?: string; enabled?: boolean; notes?: string },
): Promise<RadiusUser | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.display_name !== undefined) { fields.push(`display_name = $${idx++}`); values.push(data.display_name); }
  if (data.email !== undefined) { fields.push(`email = $${idx++}`); values.push(data.email); }
  if (data.enabled !== undefined) { fields.push(`enabled = $${idx++}`); values.push(data.enabled); }
  if (data.notes !== undefined) { fields.push(`notes = $${idx++}`); values.push(data.notes); }

  if (fields.length === 0) return getUserById(id);

  values.push(id);
  await pool.query(
    `UPDATE radius_users SET ${fields.join(', ')} WHERE id = $${idx}`,
    values,
  );

  return getUserById(id);
}

export async function deleteUser(id: number): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query('SELECT username FROM radius_users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    const username = userResult.rows[0].username;

    // Remove from all RADIUS tables
    await client.query('DELETE FROM radcheck WHERE username = $1', [username]);
    await client.query('DELETE FROM radreply WHERE username = $1', [username]);
    await client.query('DELETE FROM radusergroup WHERE username = $1', [username]);
    await client.query('DELETE FROM radius_users WHERE id = $1', [id]);

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function resetPassword(id: number, newPassword: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query('SELECT username FROM radius_users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    const username = userResult.rows[0].username;
    const radiusPass = formatRadiusPassword(newPassword);

    // Update or insert Cleartext-Password
    const updateResult = await client.query(
      `UPDATE radcheck SET value = $1 WHERE username = $2 AND attribute = 'Cleartext-Password'`,
      [radiusPass, username],
    );

    if ((updateResult.rowCount ?? 0) === 0) {
      await client.query(
        `INSERT INTO radcheck (username, attribute, op, value) VALUES ($1, 'Cleartext-Password', ':=', $2)`,
        [username, radiusPass],
      );
    }

    await client.query(
      'UPDATE radius_users SET force_password_reset = false WHERE id = $1',
      [id],
    );

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getUserGroups(username: string): Promise<{ groupname: string; priority: number }[]> {
  const result = await pool.query(
    'SELECT groupname, priority FROM radusergroup WHERE username = $1 ORDER BY priority',
    [username],
  );
  return result.rows;
}

export async function setUserGroups(
  username: string,
  groups: { groupname: string; priority: number }[],
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM radusergroup WHERE username = $1', [username]);
    for (const g of groups) {
      await client.query(
        'INSERT INTO radusergroup (username, groupname, priority) VALUES ($1, $2, $3)',
        [username, g.groupname, g.priority],
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
