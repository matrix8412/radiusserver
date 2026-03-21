import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { requirePermission } from '../middleware/rbac';
import { logAudit, getClientIp } from '../middleware/audit';
import * as adminService from '../services/admin.service';

const router = Router();

router.get('/', requirePermission('admins.view'), async (_req: Request, res: Response) => {
  const admins = await adminService.getAdmins();
  const result = [];
  for (const admin of admins) {
    const roles = await adminService.getAdminRoles(admin.id);
    result.push({ ...admin, roles });
  }
  res.json({ data: result });
});

router.get('/:id', requirePermission('admins.view'), param('id').isInt(), async (req: Request, res: Response) => {
  const admin = await adminService.getAdminById(parseInt(req.params.id));
  if (!admin) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Admin not found' } }); return; }
  const roles = await adminService.getAdminRoles(admin.id);
  res.json({ data: { ...admin, roles } });
});

router.post(
  '/',
  requirePermission('admins.create'),
  body('username').isString().trim().notEmpty().isLength({ min: 3, max: 64 }),
  body('password').isString().isLength({ min: 8 }),
  body('display_name').optional().isString().trim(),
  body('email').optional().isEmail(),
  body('role_ids').optional().isArray(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }

    try {
      const admin = await adminService.createAdmin(req.body);
      await logAudit(req.admin!.adminId, req.admin!.username, 'create', 'admin', String(admin.id), { username: admin.username }, getClientIp(req));
      res.status(201).json({ data: admin });
    } catch (err) {
      if ((err as Record<string, unknown>).code === '23505') {
        res.status(409).json({ error: { code: 'DUPLICATE', message: 'Username already exists' } });
        return;
      }
      throw err;
    }
  },
);

router.put(
  '/:id',
  requirePermission('admins.edit'),
  param('id').isInt(),
  body('display_name').optional().isString().trim(),
  body('email').optional().isEmail(),
  body('enabled').optional().isBoolean(),
  body('password').optional().isString().isLength({ min: 8 }),
  body('role_ids').optional().isArray(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }

    const admin = await adminService.updateAdmin(parseInt(req.params.id), req.body);
    if (!admin) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Admin not found' } }); return; }
    await logAudit(req.admin!.adminId, req.admin!.username, 'update', 'admin', req.params.id, { fields: Object.keys(req.body) }, getClientIp(req));
    res.json({ data: admin });
  },
);

router.delete(
  '/:id',
  requirePermission('admins.delete'),
  param('id').isInt(),
  async (req: Request, res: Response) => {
    const targetId = parseInt(req.params.id);
    if (targetId === req.admin!.adminId) {
      res.status(400).json({ error: { code: 'SELF_DELETE', message: 'Cannot delete your own account' } });
      return;
    }

    const deleted = await adminService.deleteAdmin(targetId);
    if (!deleted) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Admin not found' } }); return; }
    await logAudit(req.admin!.adminId, req.admin!.username, 'delete', 'admin', req.params.id, null, getClientIp(req));
    res.json({ data: { message: 'Admin deleted' } });
  },
);

export default router;
