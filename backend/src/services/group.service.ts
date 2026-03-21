import pool from '../db/pool';
import { RadiusGroup } from '../types';

export async function getGroups(): Promise<RadiusGroup[]> {
  const result = await pool.query<RadiusGroup>(
    'SELECT * FROM radius_groups ORDER BY groupname',
  );
  return result.rows;
}

export async function getGroupById(id: number): Promise<RadiusGroup | null> {
  const result = await pool.query<RadiusGroup>(
    'SELECT * FROM radius_groups WHERE id = $1',
    [id],
  );
  return result.rows[0] || null;
}

export async function createGroup(data: {
  groupname: string;
  description?: string;
}): Promise<RadiusGroup> {
  const result = await pool.query<RadiusGroup>(
    `INSERT INTO radius_groups (groupname, description) VALUES ($1, $2) RETURNING *`,
    [data.groupname, data.description || null],
  );
  return result.rows[0];
}

export async function updateGroup(
  id: number,
  data: { description?: string },
): Promise<RadiusGroup | null> {
  if (data.description !== undefined) {
    await pool.query('UPDATE radius_groups SET description = $1 WHERE id = $2', [data.description, id]);
  }
  return getGroupById(id);
}

export async function deleteGroup(id: number): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const groupResult = await client.query('SELECT groupname FROM radius_groups WHERE id = $1', [id]);
    if (groupResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    const groupname = groupResult.rows[0].groupname;

    await client.query('DELETE FROM radgroupcheck WHERE groupname = $1', [groupname]);
    await client.query('DELETE FROM radgroupreply WHERE groupname = $1', [groupname]);
    await client.query('DELETE FROM radusergroup WHERE groupname = $1', [groupname]);
    await client.query('DELETE FROM radius_groups WHERE id = $1', [id]);

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getGroupMembers(groupname: string): Promise<{ username: string; priority: number }[]> {
  const result = await pool.query(
    'SELECT username, priority FROM radusergroup WHERE groupname = $1 ORDER BY priority',
    [groupname],
  );
  return result.rows;
}

export async function addGroupMember(groupname: string, username: string, priority: number = 1): Promise<void> {
  await pool.query(
    `INSERT INTO radusergroup (username, groupname, priority) VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [username, groupname, priority],
  );
}

export async function removeGroupMember(groupname: string, username: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM radusergroup WHERE groupname = $1 AND username = $2',
    [groupname, username],
  );
  return (result.rowCount ?? 0) > 0;
}
