import pool from '../db/pool';
import { DashboardStats } from '../types';

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalUsersResult,
    activeUsersResult,
    totalNasResult,
    activeSessionsResult,
    authTodayResult,
    authFailedResult,
    recentAuthResult,
    recentAcctResult,
  ] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM radius_users'),
    pool.query('SELECT COUNT(*) FROM radius_users WHERE enabled = true'),
    pool.query('SELECT COUNT(*) FROM nas'),
    pool.query('SELECT COUNT(*) FROM radacct WHERE acctstoptime IS NULL'),
    pool.query("SELECT COUNT(*) FROM radpostauth WHERE authdate >= CURRENT_DATE"),
    pool.query("SELECT COUNT(*) FROM radpostauth WHERE authdate >= CURRENT_DATE AND reply != 'Access-Accept'"),
    pool.query(
      `SELECT id, username, pass, reply, authdate, class
       FROM radpostauth ORDER BY authdate DESC LIMIT 10`,
    ),
    pool.query(
      `SELECT * FROM radacct ORDER BY acctstarttime DESC NULLS LAST LIMIT 10`,
    ),
  ]);

  return {
    totalUsers: parseInt(totalUsersResult.rows[0].count, 10),
    activeUsers: parseInt(activeUsersResult.rows[0].count, 10),
    totalNas: parseInt(totalNasResult.rows[0].count, 10),
    activeSessions: parseInt(activeSessionsResult.rows[0].count, 10),
    authToday: parseInt(authTodayResult.rows[0].count, 10),
    authFailedToday: parseInt(authFailedResult.rows[0].count, 10),
    recentAuth: recentAuthResult.rows,
    recentAcct: recentAcctResult.rows,
  };
}
