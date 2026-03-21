import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { requirePermission } from '../middleware/rbac';
import { logAudit, getClientIp } from '../middleware/audit';
import * as userService from '../services/user.service';
import * as totpService from '../services/totp.service';
import { isValidUsername } from '../utils/validators';

const router = Router();

router.get(
  '/',
  requirePermission('users.view'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const result = await userService.getUsers({
      page, limit,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    });
    res.json(result);
  },
);

router.get(
  '/:id',
  requirePermission('users.view'),
  param('id').isInt(),
  async (req: Request, res: Response) => {
    const user = await userService.getUserById(parseInt(req.params.id));
    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }
    const groups = await userService.getUserGroups(user.username);
    res.json({ data: { ...user, groups } });
  },
);

router.post(
  '/',
  requirePermission('users.create'),
  body('username').isString().trim().notEmpty().custom(v => isValidUsername(v)),
  body('password').isString().isLength({ min: 8 }),
  body('display_name').optional().isString().trim(),
  body('email').optional().isEmail(),
  body('enabled').optional().isBoolean(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }

    try {
      const user = await userService.createUser(req.body);
      await logAudit(
        req.admin!.adminId, req.admin!.username, 'create', 'user',
        String(user.id), { username: user.username }, getClientIp(req),
      );
      res.status(201).json({ data: user });
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
  requirePermission('users.edit'),
  param('id').isInt(),
  body('display_name').optional().isString().trim(),
  body('email').optional().isEmail(),
  body('enabled').optional().isBoolean(),
  body('notes').optional().isString(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }

    const user = await userService.updateUser(parseInt(req.params.id), req.body);
    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    await logAudit(
      req.admin!.adminId, req.admin!.username, 'update', 'user',
      req.params.id, req.body, getClientIp(req),
    );
    res.json({ data: user });
  },
);

router.delete(
  '/:id',
  requirePermission('users.delete'),
  param('id').isInt(),
  async (req: Request, res: Response) => {
    const deleted = await userService.deleteUser(parseInt(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    await logAudit(
      req.admin!.adminId, req.admin!.username, 'delete', 'user',
      req.params.id, null, getClientIp(req),
    );
    res.json({ data: { message: 'User deleted' } });
  },
);

// Password reset
router.post(
  '/:id/reset-password',
  requirePermission('users.edit'),
  param('id').isInt(),
  body('password').isString().isLength({ min: 8 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }

    const success = await userService.resetPassword(parseInt(req.params.id), req.body.password);
    if (!success) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    await logAudit(
      req.admin!.adminId, req.admin!.username, 'reset_password', 'user',
      req.params.id, null, getClientIp(req),
    );
    res.json({ data: { message: 'Password reset successful' } });
  },
);

// TOTP setup
router.post(
  '/:id/totp/setup',
  requirePermission('users.totp'),
  param('id').isInt(),
  async (req: Request, res: Response) => {
    try {
      const result = await totpService.setupTotp(parseInt(req.params.id));
      await logAudit(
        req.admin!.adminId, req.admin!.username, 'totp_setup', 'user',
        req.params.id, null, getClientIp(req),
      );
      res.json({ data: result });
    } catch (err) {
      res.status(400).json({ error: { code: 'TOTP_ERROR', message: (err as Error).message } });
    }
  },
);

// TOTP verify
router.post(
  '/:id/totp/verify',
  requirePermission('users.totp'),
  param('id').isInt(),
  body('token').isString().isLength({ min: 6, max: 6 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }

    try {
      const valid = await totpService.verifyTotpSetup(parseInt(req.params.id), req.body.token);
      if (!valid) {
        res.status(400).json({ error: { code: 'TOTP_INVALID', message: 'Invalid TOTP code' } });
        return;
      }
      await logAudit(
        req.admin!.adminId, req.admin!.username, 'totp_verified', 'user',
        req.params.id, null, getClientIp(req),
      );
      res.json({ data: { message: 'TOTP verified and enabled' } });
    } catch (err) {
      res.status(400).json({ error: { code: 'TOTP_ERROR', message: (err as Error).message } });
    }
  },
);

// TOTP disable
router.delete(
  '/:id/totp',
  requirePermission('users.totp'),
  param('id').isInt(),
  async (req: Request, res: Response) => {
    await totpService.disableTotp(parseInt(req.params.id));
    await logAudit(
      req.admin!.adminId, req.admin!.username, 'totp_disabled', 'user',
      req.params.id, null, getClientIp(req),
    );
    res.json({ data: { message: 'TOTP disabled' } });
  },
);

// User groups
router.get(
  '/:id/groups',
  requirePermission('users.view'),
  param('id').isInt(),
  async (req: Request, res: Response) => {
    const user = await userService.getUserById(parseInt(req.params.id));
    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }
    const groups = await userService.getUserGroups(user.username);
    res.json({ data: groups });
  },
);

router.put(
  '/:id/groups',
  requirePermission('users.edit'),
  param('id').isInt(),
  body('groups').isArray(),
  async (req: Request, res: Response) => {
    const user = await userService.getUserById(parseInt(req.params.id));
    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }
    await userService.setUserGroups(user.username, req.body.groups);
    await logAudit(
      req.admin!.adminId, req.admin!.username, 'update_groups', 'user',
      req.params.id, { groups: req.body.groups }, getClientIp(req),
    );
    const groups = await userService.getUserGroups(user.username);
    res.json({ data: groups });
  },
);

export default router;
