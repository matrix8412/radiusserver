import { Router, Request, Response } from 'express';
import { query } from 'express-validator';
import { requirePermission } from '../middleware/rbac';
import * as auditService from '../services/audit.service';

const router = Router();

router.get(
  '/',
  requirePermission('audit.view'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('action').optional().isString(),
  query('entityType').optional().isString(),
  query('adminId').optional().isInt(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const result = await auditService.getAuditLogs({
      page, limit,
      search: req.query.search as string,
      action: req.query.action as string,
      entityType: req.query.entityType as string,
      adminId: req.query.adminId ? parseInt(req.query.adminId as string) : undefined,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
    });
    res.json(result);
  },
);

export default router;
