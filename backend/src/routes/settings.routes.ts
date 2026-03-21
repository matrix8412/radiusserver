import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { requirePermission } from '../middleware/rbac';
import { logAudit, getClientIp } from '../middleware/audit';
import * as settingsService from '../services/settings.service';

const router = Router();

router.get(
  '/',
  requirePermission('settings.view'),
  query('category').optional().isString(),
  async (req: Request, res: Response) => {
    const settings = await settingsService.getSettings(req.query.category as string);
    res.json({ data: settings });
  },
);

router.put(
  '/',
  requirePermission('settings.edit'),
  body('settings').isArray({ min: 1 }),
  body('settings.*.key').isString().trim().notEmpty(),
  body('settings.*.value').isString(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }

    const updated = await settingsService.updateSettings(req.body.settings, req.admin!.adminId);
    await logAudit(
      req.admin!.adminId, req.admin!.username, 'update', 'settings', null,
      { keys: req.body.settings.map((s: { key: string }) => s.key) }, getClientIp(req),
    );
    res.json({ data: updated });
  },
);

export default router;
