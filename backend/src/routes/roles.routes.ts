import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { requirePermission } from '../middleware/rbac';
import { logAudit, getClientIp } from '../middleware/audit';
import * as roleService from '../services/role.service';

const router = Router();

router.get('/', requirePermission('roles.view'), async (_req: Request, res: Response) => {
  const roles = await roleService.getRoles();
  res.json({ data: roles });
});

router.get('/permissions', requirePermission('roles.view'), async (_req: Request, res: Response) => {
  const permissions = await roleService.getPermissions();
  res.json({ data: permissions });
});

router.get('/:id', requirePermission('roles.view'), param('id').isInt(), async (req: Request, res: Response) => {
  const role = await roleService.getRoleById(parseInt(req.params.id));
  if (!role) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Role not found' } }); return; }
  res.json({ data: role });
});

router.post(
  '/',
  requirePermission('roles.create'),
  body('name').isString().trim().notEmpty().isLength({ min: 2, max: 64 }),
  body('description').optional().isString().trim(),
  body('permissions').optional().isArray(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }

    try {
      const role = await roleService.createRole(req.body);
      await logAudit(req.admin!.adminId, req.admin!.username, 'create', 'role', String(role.id), { name: role.name }, getClientIp(req));
      res.status(201).json({ data: role });
    } catch (err) {
      if ((err as Record<string, unknown>).code === '23505') {
        res.status(409).json({ error: { code: 'DUPLICATE', message: 'Role name already exists' } });
        return;
      }
      throw err;
    }
  },
);

router.put(
  '/:id',
  requirePermission('roles.edit'),
  param('id').isInt(),
  body('description').optional().isString().trim(),
  body('permissions').optional().isArray(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }

    const role = await roleService.updateRole(parseInt(req.params.id), req.body);
    if (!role) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Role not found' } }); return; }
    await logAudit(req.admin!.adminId, req.admin!.username, 'update', 'role', req.params.id, req.body, getClientIp(req));
    res.json({ data: role });
  },
);

router.delete(
  '/:id',
  requirePermission('roles.delete'),
  param('id').isInt(),
  async (req: Request, res: Response) => {
    try {
      const deleted = await roleService.deleteRole(parseInt(req.params.id));
      if (!deleted) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Role not found' } }); return; }
      await logAudit(req.admin!.adminId, req.admin!.username, 'delete', 'role', req.params.id, null, getClientIp(req));
      res.json({ data: { message: 'Role deleted' } });
    } catch (err) {
      res.status(400).json({ error: { code: 'CANNOT_DELETE', message: (err as Error).message } });
    }
  },
);

export default router;
