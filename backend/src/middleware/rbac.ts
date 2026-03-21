import { Request, Response, NextFunction } from 'express';

export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    // Superadmin has all permissions
    if (req.admin.roles.includes('superadmin')) {
      next();
      return;
    }

    const hasPermission = permissions.some(p => req.admin!.permissions.includes(p));
    if (!hasPermission) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          required: permissions,
        },
      });
      return;
    }

    next();
  };
}
