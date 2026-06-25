import { Request, Response, NextFunction } from 'express';
import { validateSession, extractToken } from '../services/auth';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req.headers.authorization);
  if (!token){
    return res.status(401).json({ error: 'Authentication required' });
  }
  const user = await validateSession(token);
  if (!user){
    return res.status(401).json({ error: 'Session expired or invalid' });
  }
  (req as any).user = user;
  next();
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req.headers.authorization);
  if (token) {
    const user = await validateSession(token);
    if (user) (req as any).user = user;
  }
  next();
}