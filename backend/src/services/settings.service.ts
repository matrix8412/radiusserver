import pool from '../db/pool';
import { SystemSetting } from '../types';

export async function getSettings(category?: string): Promise<SystemSetting[]> {
  if (category) {
    const result = await pool.query<SystemSetting>(
      'SELECT * FROM system_settings WHERE category = $1 ORDER BY key',
      [category],
    );
    return result.rows;
  }
  const result = await pool.query<SystemSetting>('SELECT * FROM system_settings ORDER BY category, key');
  return result.rows;
}

export async function getSetting(key: string): Promise<SystemSetting | null> {
  const result = await pool.query<SystemSetting>(
    'SELECT * FROM system_settings WHERE key = $1',
    [key],
  );
  return result.rows[0] || null;
}

export async function updateSetting(key: string, value: string, adminId: number): Promise<SystemSetting | null> {
  const result = await pool.query<SystemSetting>(
    `UPDATE system_settings SET value = $1, updated_by = $2 WHERE key = $3 RETURNING *`,
    [value, adminId, key],
  );
  return result.rows[0] || null;
}

export async function updateSettings(
  settings: { key: string; value: string }[],
  adminId: number,
): Promise<SystemSetting[]> {
  const updated: SystemSetting[] = [];
  for (const s of settings) {
    const result = await updateSetting(s.key, s.value, adminId);
    if (result) updated.push(result);
  }
  return updated;
}
