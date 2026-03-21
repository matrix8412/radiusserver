import { Router, Request, Response } from 'express';
import { authMiddleware, internalAuthMiddleware } from '../middleware/auth';
import { validateTotp } from '../services/totp.service';

import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import groupsRoutes from './groups.routes';
import attributesRoutes from './attributes.routes';
import nasRoutes from './nas.routes';
import adminsRoutes from './admins.routes';
import rolesRoutes from './roles.routes';
import logsRoutes from './logs.routes';
import settingsRoutes from './settings.routes';
import certificatesRoutes from './certificates.routes';
import auditRoutes from './audit.routes';
import dashboardRoutes from './dashboard.routes';
import healthRoutes from './health.routes';

const router = Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/health', healthRoutes);

// Internal route for FreeRADIUS TOTP validation
router.post('/internal/validate-totp', internalAuthMiddleware, async (req: Request, res: Response) => {
  const username = req.body.username || req.query.username;
  const token = req.body.token || req.query.token;

  if (!username || !token) {
    res.status(400).json({ error: 'Missing username or token' });
    return;
  }

  const valid = await validateTotp(username as string, token as string);
  if (valid) {
    res.status(200).json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

// All routes below require authentication
router.use(authMiddleware);

router.use('/users', usersRoutes);
router.use('/groups', groupsRoutes);
router.use('/attributes', attributesRoutes);
router.use('/nas', nasRoutes);
router.use('/admins', adminsRoutes);
router.use('/roles', rolesRoutes);
router.use('/logs', logsRoutes);
router.use('/settings', settingsRoutes);
router.use('/certificates', certificatesRoutes);
router.use('/audit', auditRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
