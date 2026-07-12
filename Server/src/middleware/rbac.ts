import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

type Resource = 'fleet' | 'drivers' | 'trips' | 'finance' | 'analytics' | 'settings' | 'users';
type Action = 'view' | 'create' | 'update' | 'delete';

// We map what each role can do on each resource
const rolePermissions: Record<Role, Partial<Record<Resource, Action[]>>> = {
  SUPER_ADMIN: {
    fleet: ['view', 'create', 'update', 'delete'],
    drivers: ['view', 'create', 'update', 'delete'],
    trips: ['view', 'create', 'update', 'delete'],
    finance: ['view', 'create', 'update', 'delete'],
    analytics: ['view'],
    settings: ['view', 'create', 'update', 'delete'],
    users: ['view', 'create', 'update', 'delete']
  },
  BRANCH_ADMIN: {
    fleet: ['view', 'create', 'update', 'delete'],
    drivers: ['view', 'create', 'update', 'delete'],
    trips: ['view', 'create', 'update', 'delete'],
    finance: ['view', 'create', 'update', 'delete'],
    analytics: ['view'],
    settings: ['view', 'update'],
    users: ['view', 'create', 'update', 'delete']
  },
  FLEET_MANAGER: {
    fleet: ['view', 'create', 'update', 'delete'],
    drivers: ['view'],
    trips: ['view'], 
    finance: ['view', 'create', 'update', 'delete'], 
    analytics: ['view'],
    settings: ['view', 'update'],
    users: []
  },
  DISPATCHER: {
    fleet: ['view'],
    drivers: ['view'],
    trips: ['view', 'create', 'update', 'delete'],
    finance: ['view', 'create'],
    analytics: [],
    settings: [],
    users: []
  },
  SAFETY_OFFICER: {
    fleet: ['view'],
    drivers: ['view', 'create', 'update', 'delete'],
    trips: ['view'],
    finance: ['view'],
    analytics: ['view'],
    settings: [],
    users: []
  },
  FINANCIAL_ANALYST: {
    fleet: ['view'],
    drivers: ['view'],
    trips: ['view'],
    finance: ['view', 'create', 'update', 'delete'],
    analytics: ['view'],
    settings: [],
    users: []
  }
};

export const requirePermission = (resource: Resource, action: Action) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as Role;

    if (!userRole) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const permissions = rolePermissions[userRole]?.[resource] || [];

    if (!permissions.includes(action)) {
      return res.status(403).json({ 
        error: { 
          code: 'FORBIDDEN', 
          message: `Your role (${userRole}) does not have permission to ${action} ${resource}` 
        } 
      });
    }

    next();
  };
};
