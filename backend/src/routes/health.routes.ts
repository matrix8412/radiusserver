import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { execSync } from 'child_process';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const checks: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  // Check PostgreSQL
  try {
    const dbResult = await pool.query('SELECT 1 AS ok, NOW() AS time');
    checks.database = { status: 'ok', time: dbResult.rows[0].time };
  } catch (err) {
    checks.database = { status: 'error', message: (err as Error).message };
    checks.status = 'degraded';
  }

  // Check FreeRADIUS
  try {
    execSync('pgrep -x radiusd', { encoding: 'utf-8' });
    checks.freeradius = { status: 'ok' };
  } catch {
    checks.freeradius = { status: 'error', message: 'Process not running' };
    checks.status = 'degraded';
  }

  // Database stats
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM radius_users) AS total_users,
        (SELECT COUNT(*) FROM nas) AS total_nas,
        (SELECT COUNT(*) FROM radacct WHERE acctstoptime IS NULL) AS active_sessions,
        (SELECT pg_size_pretty(pg_database_size(current_database()))) AS db_size
    `);
    checks.stats = stats.rows[0];
  } catch {
    // Non-critical
  }

  const statusCode = checks.status === 'ok' ? 200 : 503;
  res.status(statusCode).json({ data: checks });
});

export default router;
