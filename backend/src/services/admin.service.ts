import pool from '../db/pool';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { AdminUser, JwtPayload } from '../types';

export async function authenticateAdmin(
  username: string,
  password: string,
): Promise<{ token: string; admin: Omit<AdminUser, 'password_hash'> }> {
  const result = await pool.query<AdminUser>(
    'SELECT * FROM admin_users WHERE username = $1 AND enabled = true',
    [username],
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const admin = result.rows[0];
  const valid = await verifyPassword(password, admin.password_hash);

  if (!valid) {
    throw new Error('Invalid credentials');
  }

  // Get roles and permissions
  const rolesResult = await pool.query<{ name: string }>(
    `SELECT r.name FROM admin_roles r
     INNER JOIN admin_user_roles ur ON ur.role_id = r.id
     WHERE ur.admin_id = $1`,
    [admin.id],
  );

  const roles = rolesResult.rows.map(r => r.name);

  const permsResult = await pool.query<{ name: string }>(
    `SELECT DISTINCT p.name FROM admin_permissions p
     INNER JOIN admin_role_permissions rp ON rp.permission_id = p.id
     INNER JOIN admin_user_roles ur ON ur.role_id = rp.role_id
     WHERE ur.admin_id = $1`,
    [admin.id],
  );

  const permissions = permsResult.rows.map(p => p.name);

  const payload: JwtPayload = {
    adminId: admin.id,
    username: admin.username,
    roles,
    permissions,
  };

  const token = signToken(payload);

  // Update last_login
  await pool.query('UPDATE admin_users SET last_login = NOW() WHERE id = $1', [admin.id]);

  const { password_hash: _, ...adminWithoutPassword } = admin;
  return { token, admin: adminWithoutPassword };
}

export async function getAdmins(): Promise<Omit<AdminUser, 'password_hash'>[]> {
  const result = await pool.query(
    `SELECT id, username, display_name, email, enabled, last_login, created_at, updated_at
     FROM admin_users ORDER BY id`,
  );
  return result.rows;
}

export async function getAdminById(id: number): Promise<Omit<AdminUser, 'password_hash'> | null> {
  const result = await pool.query(
    `SELECT id, username, display_name, email, enabled, last_login, created_at, updated_at
     FROM admin_users WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function createAdmin(data: {
  username: string;
  password: string;
  display_name?: string;
  email?: string;
  role_ids?: number[];
}): Promise<Omit<AdminUser, 'password_hash'>> {
  const passwordHash = await hashPassword(data.password);

  const result = await pool.query(
    `INSERT INTO admin_users (username, password_hash, display_name, email)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, display_name, email, enabled, last_login, created_at, updated_at`,
    [data.username, passwordHash, data.display_name || null, data.email || null],
  );

  const admin = result.rows[0];

  if (data.role_ids && data.role_ids.length > 0) {
    for (const roleId of data.role_ids) {
      await pool.query(
        'INSERT INTO admin_user_roles (admin_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [admin.id, roleId],
      );
    }
  }

  return admin;
}

export async function updateAdmin(
  id: number,
  data: { display_name?: string; email?: string; enabled?: boolean; password?: string; role_ids?: number[] },
): Promise<Omit<AdminUser, 'password_hash'> | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.display_name !== undefined) {
    fields.push(`display_name = $${idx++}`);
    values.push(data.display_name);
  }
  if (data.email !== undefined) {
    fields.push(`email = $${idx++}`);
    values.push(data.email);
  }
  if (data.enabled !== undefined) {
    fields.push(`enabled = $${idx++}`);
    values.push(data.enabled);
  }
  if (data.password) {
    const hash = await hashPassword(data.password);
    fields.push(`password_hash = $${idx++}`);
    values.push(hash);
  }

  if (fields.length > 0) {
    values.push(id);
    await pool.query(
      `UPDATE admin_users SET ${fields.join(', ')} WHERE id = $${idx}`,
      values,
    );
  }

  if (data.role_ids !== undefined) {
    await pool.query('DELETE FROM admin_user_roles WHERE admin_id = $1', [id]);
    for (const roleId of data.role_ids) {
      await pool.query(
        'INSERT INTO admin_user_roles (admin_id, role_id) VALUES ($1, $2)',
        [id, roleId],
      );
    }
  }

  return getAdminById(id);
}

export async function deleteAdmin(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM admin_users WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getAdminRoles(adminId: number): Promise<{ id: number; name: string }[]> {
  const result = await pool.query(
    `SELECT r.id, r.name FROM admin_roles r
     INNER JOIN admin_user_roles ur ON ur.role_id = r.id
     WHERE ur.admin_id = $1`,
    [adminId],
  );
  return result.rows;
}
