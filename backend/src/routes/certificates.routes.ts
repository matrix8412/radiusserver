import { Router, Request, Response } from 'express';
import { requirePermission } from '../middleware/rbac';
import { logAudit, getClientIp } from '../middleware/audit';
import * as certService from '../services/certificate.service';

const router = Router();

router.get('/', requirePermission('certificates.view'), async (_req: Request, res: Response) => {
  const certs = await certService.getCertificates();
  res.json({ data: certs });
});

router.post('/refresh', requirePermission('certificates.view'), async (_req: Request, res: Response) => {
  const certs = await certService.refreshCertificateMetadata();
  res.json({ data: certs });
});

router.post('/generate', requirePermission('certificates.manage'), async (req: Request, res: Response) => {
  try {
    const output = await certService.generateCertificates();
    await logAudit(
      req.admin!.adminId, req.admin!.username, 'generate_certificates', 'certificates',
      null, null, getClientIp(req),
    );
    res.json({ data: { message: 'Certificates generated', output } });
  } catch (err) {
    res.status(500).json({ error: { code: 'CERT_ERROR', message: (err as Error).message } });
  }
});

export default router;
