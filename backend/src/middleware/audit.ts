import { Request, Response, NextFunction } from 'express';
import pool from '../db/pool';

export function auditMiddleware(action: string, entityType?: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Store audit info on the request for later logging
    (req as unknown as Record<string, unknown>)._audit = { action, entityType };
    next();
  };
}

export async function logAudit(
  adminId: number | null,
  adminUsername: string | null,
  action: string,
  entityType: string | null,
  entityId: string | null,
  details: Record<string, unknown> | null,
  ipAddress: string | null,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_log (admin_id, admin_username, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [adminId, adminUsername, action, entityType, entityId, details ? JSON.stringify(details) : null, ipAddress],
    );
  } catch (err) {
    console.error('[audit] Failed to write audit log:', err);
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}
