import { Router, Request, Response } from 'express';
import { query } from 'express-validator';
import { requirePermission } from '../middleware/rbac';
import { logAudit, getClientIp } from '../middleware/audit';
import * as logService from '../services/log.service';

const router = Router();

router.get(
  '/auth',
  requirePermission('logs.view'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('username').optional().isString(),
  query('reply').optional().isString(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const result = await logService.getAuthLogs({
      page, limit,
      search: req.query.search as string,
      username: req.query.username as string,
      reply: req.query.reply as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
    });
    res.json(result);
  },
);

router.get(
  '/accounting',
  requirePermission('logs.view'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('username').optional().isString(),
  query('nasipaddress').optional().isString(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('activeOnly').optional().isBoolean(),
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const result = await logService.getAccountingLogs({
      page, limit,
      search: req.query.search as string,
      username: req.query.username as string,
      nasipaddress: req.query.nasipaddress as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      activeOnly: req.query.activeOnly === 'true',
    });
    res.json(result);
  },
);

router.post(
  '/purge/auth',
  requirePermission('logs.purge'),
  async (req: Request, res: Response) => {
    const days = parseInt(req.body.retentionDays) || 90;
    const deleted = await logService.purgeAuthLogs(days);
    await logAudit(req.admin!.adminId, req.admin!.username, 'purge_auth_logs', 'logs', null, { days, deleted }, getClientIp(req));
    res.json({ data: { deleted, retentionDays: days } });
  },
);

router.post(
  '/purge/accounting',
  requirePermission('logs.purge'),
  async (req: Request, res: Response) => {
    const days = parseInt(req.body.retentionDays) || 180;
    const deleted = await logService.purgeAcctLogs(days);
    await logAudit(req.admin!.adminId, req.admin!.username, 'purge_acct_logs', 'logs', null, { days, deleted }, getClientIp(req));
    res.json({ data: { deleted, retentionDays: days } });
  },
);

export default router;
