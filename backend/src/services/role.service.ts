import pool from '../db/pool';
import { AdminRole, AdminPermission } from '../types';

export async function getRoles(): Promise<(AdminRole & { permissions: string[] })[]> {
  const roles = await pool.query<AdminRole>('SELECT * FROM admin_roles ORDER BY id');

  const result: (AdminRole & { permissions: string[] })[] = [];
  for (const role of roles.rows) {
    const perms = await pool.query<{ name: string }>(
      `SELECT p.name FROM admin_permissions p
       INNER JOIN admin_role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = $1 ORDER BY p.name`,
      [role.id],
    );
    result.push({ ...role, permissions: perms.rows.map(p => p.name) });
  }

  return result;
}

export async function getRoleById(id: number): Promise<(AdminRole & { permissions: string[] }) | null> {
  const roleResult = await pool.query<AdminRole>('SELECT * FROM admin_roles WHERE id = $1', [id]);
  if (roleResult.rows.length === 0) return null;

  const role = roleResult.rows[0];
  const perms = await pool.query<{ name: string }>(
    `SELECT p.name FROM admin_permissions p
     INNER JOIN admin_role_permissions rp ON rp.permission_id = p.id
     WHERE rp.role_id = $1`,
    [role.id],
  );

  return { ...role, permissions: perms.rows.map(p => p.name) };
}

export async function createRole(data: {
  name: string;
  description?: string;
  permissions?: string[];
}): Promise<AdminRole & { permissions: string[] }> {
  const result = await pool.query<AdminRole>(
    'INSERT INTO admin_roles (name, description) VALUES ($1, $2) RETURNING *',
    [data.name, data.description || null],
  );

  const role = result.rows[0];

  if (data.permissions && data.permissions.length > 0) {
    for (const permName of data.permissions) {
      await pool.query(
        `INSERT INTO admin_role_permissions (role_id, permission_id)
         SELECT $1, id FROM admin_permissions WHERE name = $2
         ON CONFLICT DO NOTHING`,
        [role.id, permName],
      );
    }
  }

  return getRoleById(role.id) as Promise<AdminRole & { permissions: string[] }>;
}

export async function updateRole(
  id: number,
  data: { description?: string; permissions?: string[] },
): Promise<(AdminRole & { permissions: string[] }) | null> {
  const existing = await pool.query('SELECT is_system FROM admin_roles WHERE id = $1', [id]);
  if (existing.rows.length === 0) return null;

  if (data.description !== undefined) {
    await pool.query('UPDATE admin_roles SET description = $1 WHERE id = $2', [data.description, id]);
  }

  if (data.permissions !== undefined) {
    await pool.query('DELETE FROM admin_role_permissions WHERE role_id = $1', [id]);
    for (const permName of data.permissions) {
      await pool.query(
        `INSERT INTO admin_role_permissions (role_id, permission_id)
         SELECT $1, id FROM admin_permissions WHERE name = $2
         ON CONFLICT DO NOTHING`,
        [id, permName],
      );
    }
  }

  return getRoleById(id);
}

export async function deleteRole(id: number): Promise<boolean> {
  // Don't allow deleting system roles
  const check = await pool.query('SELECT is_system FROM admin_roles WHERE id = $1', [id]);
  if (check.rows.length === 0) return false;
  if (check.rows[0].is_system) {
    throw new Error('Cannot delete system roles');
  }

  const result = await pool.query('DELETE FROM admin_roles WHERE id = $1 AND is_system = false', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getPermissions(): Promise<AdminPermission[]> {
  const result = await pool.query<AdminPermission>('SELECT * FROM admin_permissions ORDER BY category, name');
  return result.rows;
}
