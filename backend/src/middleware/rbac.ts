import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { Role } from '@prisma/client';

type Action = 'view' | 'create' | 'update' | 'delete' | 'full';
type Resource = 'fleet' | 'drivers' | 'trips' | 'finance' | 'analytics';

const permissionMatrix: Record<Role, Record<Resource, Action | 'none'>> = {
  FLEET_MANAGER: { fleet: 'full', drivers: 'full', trips: 'none', finance: 'full', analytics: 'full' },
  DISPATCHER: { fleet: 'view', drivers: 'none', trips: 'full', finance: 'none', analytics: 'none' },
  SAFETY_OFFICER: { fleet: 'none', drivers: 'full', trips: 'view', finance: 'none', analytics: 'none' },
  FINANCIAL_ANALYST: { fleet: 'view', drivers: 'none', trips: 'none', finance: 'full', analytics: 'full' }
};

export const requirePermission = (resource: Resource, requiredAction: Action) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const userRole = req.user.role;
    const allowedAction = permissionMatrix[userRole][resource];

    if (allowedAction === 'none') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: `Role ${userRole} has no access to ${resource}` } });
    }

    if (allowedAction === 'full') {
      return next();
    }

    if (allowedAction === 'view' && requiredAction !== 'view') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: `Role ${userRole} only has view access to ${resource}` } });
    }

    next();
  };
};

export const requireRole = (roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: `Required one of roles: ${roles.join(', ')}` } });
    }

    next();
  };
};
