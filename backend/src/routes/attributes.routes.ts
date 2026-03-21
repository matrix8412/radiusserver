import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { requirePermission } from '../middleware/rbac';
import { logAudit, getClientIp } from '../middleware/audit';
import * as attrService from '../services/attribute.service';
import { isValidOp } from '../utils/validators';

const router = Router();

// ---- Check Attributes ----

router.get(
  '/check',
  requirePermission('attributes.view'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const result = await attrService.getCheckAttributes({ page, limit, search: req.query.search as string });
    res.json(result);
  },
);

router.get(
  '/check/user/:username',
  requirePermission('attributes.view'),
  param('username').isString(),
  async (req: Request, res: Response) => {
    const attrs = await attrService.getCheckAttributesByUsername(req.params.username);
    res.json({ data: attrs });
  },
);

router.post(
  '/check',
  requirePermission('attributes.create'),
  body('username').isString().trim().notEmpty(),
  body('attribute').isString().trim().notEmpty(),
  body('op').isString().trim().custom(v => isValidOp(v)),
  body('value').isString(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }

    const attr = await attrService.createCheckAttribute(req.body);
    await logAudit(req.admin!.adminId, req.admin!.username, 'create', 'radcheck', String(attr.id), req.body, getClientIp(req));
    res.status(201).json({ data: attr });
  },
);

router.put(
  '/check/:id',
  requirePermission('attributes.edit'),
  param('id').isInt(),
  body('attribute').optional().isString().trim(),
  body('op').optional().isString().trim().custom(v => !v || isValidOp(v)),
  body('value').optional().isString(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }

    const attr = await attrService.updateCheckAttribute(parseInt(req.params.id), req.body);
    if (!attr) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Attribute not found' } });
      return;
    }
    await logAudit(req.admin!.adminId, req.admin!.username, 'update', 'radcheck', req.params.id, req.body, getClientIp(req));
    res.json({ data: attr });
  },
);

router.delete(
  '/check/:id',
  requirePermission('attributes.delete'),
  param('id').isInt(),
  async (req: Request, res: Response) => {
    const deleted = await attrService.deleteCheckAttribute(parseInt(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Attribute not found' } });
      return;
    }
    await logAudit(req.admin!.adminId, req.admin!.username, 'delete', 'radcheck', req.params.id, null, getClientIp(req));
    res.json({ data: { message: 'Attribute deleted' } });
  },
);

// ---- Reply Attributes ----

router.get(
  '/reply',
  requirePermission('attributes.view'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const result = await attrService.getReplyAttributes({ page, limit, search: req.query.search as string });
    res.json(result);
  },
);

router.get(
  '/reply/user/:username',
  requirePermission('attributes.view'),
  param('username').isString(),
  async (req: Request, res: Response) => {
    const attrs = await attrService.getReplyAttributesByUsername(req.params.username);
    res.json({ data: attrs });
  },
);

router.post(
  '/reply',
  requirePermission('attributes.create'),
  body('username').isString().trim().notEmpty(),
  body('attribute').isString().trim().notEmpty(),
  body('op').isString().trim().custom(v => isValidOp(v)),
  body('value').isString(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }

    const attr = await attrService.createReplyAttribute(req.body);
    await logAudit(req.admin!.adminId, req.admin!.username, 'create', 'radreply', String(attr.id), req.body, getClientIp(req));
    res.status(201).json({ data: attr });
  },
);

router.put(
  '/reply/:id',
  requirePermission('attributes.edit'),
  param('id').isInt(),
  body('attribute').optional().isString().trim(),
  body('op').optional().isString().trim().custom(v => !v || isValidOp(v)),
  body('value').optional().isString(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }

    const attr = await attrService.updateReplyAttribute(parseInt(req.params.id), req.body);
    if (!attr) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Attribute not found' } });
      return;
    }
    await logAudit(req.admin!.adminId, req.admin!.username, 'update', 'radreply', req.params.id, req.body, getClientIp(req));
    res.json({ data: attr });
  },
);

router.delete(
  '/reply/:id',
  requirePermission('attributes.delete'),
  param('id').isInt(),
  async (req: Request, res: Response) => {
    const deleted = await attrService.deleteReplyAttribute(parseInt(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Attribute not found' } });
      return;
    }
    await logAudit(req.admin!.adminId, req.admin!.username, 'delete', 'radreply', req.params.id, null, getClientIp(req));
    res.json({ data: { message: 'Attribute deleted' } });
  },
);

// ---- Group Attributes ----

router.get('/group-check/:groupname', requirePermission('attributes.view'), async (req: Request, res: Response) => {
  const attrs = await attrService.getGroupCheckAttributes(req.params.groupname);
  res.json({ data: attrs });
});

router.post(
  '/group-check',
  requirePermission('attributes.create'),
  body('groupname').isString().trim().notEmpty(),
  body('attribute').isString().trim().notEmpty(),
  body('op').isString().trim().custom(v => isValidOp(v)),
  body('value').isString(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }
    const attr = await attrService.createGroupCheckAttribute(req.body);
    await logAudit(req.admin!.adminId, req.admin!.username, 'create', 'radgroupcheck', String(attr.id), req.body, getClientIp(req));
    res.status(201).json({ data: attr });
  },
);

router.delete('/group-check/:id', requirePermission('attributes.delete'), param('id').isInt(), async (req: Request, res: Response) => {
  const deleted = await attrService.deleteGroupCheckAttribute(parseInt(req.params.id));
  if (!deleted) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Attribute not found' } }); return; }
  await logAudit(req.admin!.adminId, req.admin!.username, 'delete', 'radgroupcheck', req.params.id, null, getClientIp(req));
  res.json({ data: { message: 'Attribute deleted' } });
});

router.get('/group-reply/:groupname', requirePermission('attributes.view'), async (req: Request, res: Response) => {
  const attrs = await attrService.getGroupReplyAttributes(req.params.groupname);
  res.json({ data: attrs });
});

router.post(
  '/group-reply',
  requirePermission('attributes.create'),
  body('groupname').isString().trim().notEmpty(),
  body('attribute').isString().trim().notEmpty(),
  body('op').isString().trim().custom(v => isValidOp(v)),
  body('value').isString(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }
    const attr = await attrService.createGroupReplyAttribute(req.body);
    await logAudit(req.admin!.adminId, req.admin!.username, 'create', 'radgroupreply', String(attr.id), req.body, getClientIp(req));
    res.status(201).json({ data: attr });
  },
);

router.delete('/group-reply/:id', requirePermission('attributes.delete'), param('id').isInt(), async (req: Request, res: Response) => {
  const deleted = await attrService.deleteGroupReplyAttribute(parseInt(req.params.id));
  if (!deleted) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Attribute not found' } }); return; }
  await logAudit(req.admin!.adminId, req.admin!.username, 'delete', 'radgroupreply', req.params.id, null, getClientIp(req));
  res.json({ data: { message: 'Attribute deleted' } });
});

export default router;
