import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { JwtPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      admin?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.admin = payload;
    next();
  } catch {
    res.clearCookie('token');
    res.status(401).json({ error: { code: 'TOKEN_INVALID', message: 'Invalid or expired token' } });
  }
}

export function internalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers['x-internal-secret'] as string;
  const expected = process.env.INTERNAL_SECRET || 'dev-internal-secret';

  if (!secret || secret !== expected) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Invalid internal secret' } });
    return;
  }
  next();
}
