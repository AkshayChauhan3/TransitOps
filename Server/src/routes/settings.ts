import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { updateBranchSchema } from '../types';

const router = Router();
router.use(authenticateToken);

// GET /settings - Get branch settings
router.get('/', requirePermission('settings', 'view'), async (req, res, next) => {
  try {
    const branchId = req.user!.role === 'SUPER_ADMIN' ? parseInt(req.query.branchId as string, 10) : req.user!.branchId!;
    
    if (!branchId) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Super Admins must provide ?branchId' } });
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId }
    });

    if (!branch || branch.deletedAt) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Branch not found' } });
    }

    res.json(branch);
  } catch (error) {
    next(error);
  }
});

// PUT /settings - Update branch settings
router.put('/', requirePermission('settings', 'update'), validate(updateBranchSchema), async (req, res, next) => {
  try {
    const branchId = req.user!.role === 'SUPER_ADMIN' ? parseInt(req.query.branchId as string, 10) : req.user!.branchId!;
    
    if (!branchId) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Super Admins must provide ?branchId' } });
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch || branch.deletedAt) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Branch not found' } });
    }

    const updated = await prisma.branch.update({
      where: { id: branchId },
      data: req.body
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// GET /settings/rbac - Expose permission matrix to frontend
router.get('/rbac', requirePermission('settings', 'view'), (req, res) => {
  // Hardcoded mirroring of the matrix for frontend UI rendering
  const matrix = {
    SUPER_ADMIN: { users: true, fleet: true, drivers: true, trips: true, finance: true, analytics: true, settings: true },
    BRANCH_ADMIN: { users: true, fleet: false, drivers: false, trips: true, finance: false, analytics: true, settings: true },
    FLEET_MANAGER: { users: false, fleet: true, drivers: true, trips: false, finance: true, analytics: true, settings: true },
    DISPATCHER: { users: false, fleet: true, drivers: true, trips: true, finance: false, analytics: false, settings: false },
    SAFETY_OFFICER: { users: false, fleet: false, drivers: true, trips: true, finance: false, analytics: false, settings: false },
    FINANCIAL_ANALYST: { users: false, fleet: true, drivers: false, trips: false, finance: true, analytics: true, settings: false }
  };
  res.json(matrix);
});

export default router;
