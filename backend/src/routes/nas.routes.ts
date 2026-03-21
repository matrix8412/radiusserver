import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { requirePermission } from '../middleware/rbac';
import { logAudit, getClientIp } from '../middleware/audit';
import * as nasService from '../services/nas.service';

const router = Router();

router.get(
  '/',
  requirePermission('nas.view'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const result = await nasService.getNasDevices({ page, limit, search: req.query.search as string });
    res.json(result);
  },
);

router.get('/:id', requirePermission('nas.view'), param('id').isInt(), async (req: Request, res: Response) => {
  const nas = await nasService.getNasById(parseInt(req.params.id));
  if (!nas) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'NAS not found' } }); return; }
  res.json({ data: nas });
});

router.post(
  '/',
  requirePermission('nas.create'),
  body('nasname').isString().trim().notEmpty(),
  body('shortname').optional().isString().trim(),
  body('type').optional().isString().trim(),
  body('ports').optional().isInt(),
  body('secret').isString().isLength({ min: 6 }),
  body('server').optional().isString().trim(),
  body('community').optional().isString().trim(),
  body('description').optional().isString().trim(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }

    const nas = await nasService.createNas(req.body);
    await logAudit(req.admin!.adminId, req.admin!.username, 'create', 'nas', String(nas.id), { nasname: nas.nasname }, getClientIp(req));
    res.status(201).json({ data: nas });
  },
);

router.put(
  '/:id',
  requirePermission('nas.edit'),
  param('id').isInt(),
  body('nasname').optional().isString().trim(),
  body('shortname').optional().isString().trim(),
  body('type').optional().isString().trim(),
  body('ports').optional().isInt(),
  body('secret').optional().isString().isLength({ min: 6 }),
  body('server').optional().isString().trim(),
  body('community').optional().isString().trim(),
  body('description').optional().isString().trim(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }

    const nas = await nasService.updateNas(parseInt(req.params.id), req.body);
    if (!nas) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'NAS not found' } }); return; }
    await logAudit(req.admin!.adminId, req.admin!.username, 'update', 'nas', req.params.id, req.body, getClientIp(req));
    res.json({ data: nas });
  },
);

router.delete(
  '/:id',
  requirePermission('nas.delete'),
  param('id').isInt(),
  async (req: Request, res: Response) => {
    const deleted = await nasService.deleteNas(parseInt(req.params.id));
    if (!deleted) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'NAS not found' } }); return; }
    await logAudit(req.admin!.adminId, req.admin!.username, 'delete', 'nas', req.params.id, null, getClientIp(req));
    res.json({ data: { message: 'NAS deleted' } });
  },
);

export default router;
