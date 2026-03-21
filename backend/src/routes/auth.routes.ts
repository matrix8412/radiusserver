import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateAdmin } from '../services/admin.service';
import { loginLimiter } from '../middleware/rateLimit';
import { logAudit, getClientIp } from '../middleware/audit';

const router = Router();

router.post(
  '/login',
  loginLimiter,
  body('username').isString().trim().notEmpty(),
  body('password').isString().notEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', details: errors.array() } });
      return;
    }

    try {
      const { token, admin } = await authenticateAdmin(req.body.username, req.body.password);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600000, // 1 hour
        path: '/',
      });

      await logAudit(
        admin.id, admin.username, 'login', 'admin', String(admin.id),
        null, getClientIp(req),
      );

      res.json({ data: admin });
    } catch {
      await logAudit(
        null, req.body.username, 'login_failed', 'admin', null,
        null, getClientIp(req),
      );
      res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' } });
    }
  },
);

router.post('/logout', (req: Request, res: Response) => {
  if (req.admin) {
    logAudit(req.admin.adminId, req.admin.username, 'logout', 'admin', String(req.admin.adminId), null, getClientIp(req));
  }
  res.clearCookie('token', { path: '/' });
  res.json({ data: { message: 'Logged out' } });
});

router.get('/me', (req: Request, res: Response) => {
  if (!req.admin) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    return;
  }
  res.json({ data: req.admin });
});

export default router;
