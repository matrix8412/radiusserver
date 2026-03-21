import { Router, Request, Response } from 'express';
import { requirePermission } from '../middleware/rbac';
import * as dashboardService from '../services/dashboard.service';

const router = Router();

router.get('/stats', requirePermission('health.view'), async (_req: Request, res: Response) => {
  const stats = await dashboardService.getDashboardStats();
  res.json({ data: stats });
});

export default router;
