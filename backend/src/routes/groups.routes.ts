import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { requirePermission } from '../middleware/rbac';
import { logAudit, getClientIp } from '../middleware/audit';
import * as groupService from '../services/group.service';
import { isValidGroupname } from '../utils/validators';

const router = Router();

router.get('/', requirePermission('groups.view'), async (_req: Request, res: Response) => {
  const groups = await groupService.getGroups();
  res.json({ data: groups });
});

router.get('/:id', requirePermission('groups.view'), param('id').isInt(), async (req: Request, res: Response) => {
  const group = await groupService.getGroupById(parseInt(req.params.id));
  if (!group) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Group not found' } });
    return;
  }
  const members = await groupService.getGroupMembers(group.groupname);
  res.json({ data: { ...group, members } });
});

router.post(
  '/',
  requirePermission('groups.create'),
  body('groupname').isString().trim().notEmpty().custom(v => isValidGroupname(v)),
  body('description').optional().isString().trim(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }

    try {
      const group = await groupService.createGroup(req.body);
      await logAudit(req.admin!.adminId, req.admin!.username, 'create', 'group', String(group.id), { groupname: group.groupname }, getClientIp(req));
      res.status(201).json({ data: group });
    } catch (err) {
      if ((err as Record<string, unknown>).code === '23505') {
        res.status(409).json({ error: { code: 'DUPLICATE', message: 'Group already exists' } });
        return;
      }
      throw err;
    }
  },
);

router.put(
  '/:id',
  requirePermission('groups.edit'),
  param('id').isInt(),
  body('description').optional().isString().trim(),
  async (req: Request, res: Response) => {
    const group = await groupService.updateGroup(parseInt(req.params.id), req.body);
    if (!group) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Group not found' } });
      return;
    }
    await logAudit(req.admin!.adminId, req.admin!.username, 'update', 'group', req.params.id, req.body, getClientIp(req));
    res.json({ data: group });
  },
);

router.delete(
  '/:id',
  requirePermission('groups.delete'),
  param('id').isInt(),
  async (req: Request, res: Response) => {
    const deleted = await groupService.deleteGroup(parseInt(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Group not found' } });
      return;
    }
    await logAudit(req.admin!.adminId, req.admin!.username, 'delete', 'group', req.params.id, null, getClientIp(req));
    res.json({ data: { message: 'Group deleted' } });
  },
);

// Group members
router.get('/:id/members', requirePermission('groups.view'), param('id').isInt(), async (req: Request, res: Response) => {
  const group = await groupService.getGroupById(parseInt(req.params.id));
  if (!group) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Group not found' } });
    return;
  }
  const members = await groupService.getGroupMembers(group.groupname);
  res.json({ data: members });
});

router.post(
  '/:id/members',
  requirePermission('groups.edit'),
  param('id').isInt(),
  body('username').isString().trim().notEmpty(),
  body('priority').optional().isInt({ min: 0 }),
  async (req: Request, res: Response) => {
    const group = await groupService.getGroupById(parseInt(req.params.id));
    if (!group) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Group not found' } });
      return;
    }
    await groupService.addGroupMember(group.groupname, req.body.username, req.body.priority || 1);
    await logAudit(req.admin!.adminId, req.admin!.username, 'add_member', 'group', req.params.id, { username: req.body.username }, getClientIp(req));
    res.status(201).json({ data: { message: 'Member added' } });
  },
);

router.delete(
  '/:id/members/:username',
  requirePermission('groups.edit'),
  param('id').isInt(),
  param('username').isString(),
  async (req: Request, res: Response) => {
    const group = await groupService.getGroupById(parseInt(req.params.id));
    if (!group) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Group not found' } });
      return;
    }
    const removed = await groupService.removeGroupMember(group.groupname, req.params.username);
    if (!removed) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Member not found' } });
      return;
    }
    await logAudit(req.admin!.adminId, req.admin!.username, 'remove_member', 'group', req.params.id, { username: req.params.username }, getClientIp(req));
    res.json({ data: { message: 'Member removed' } });
  },
);

export default router;
