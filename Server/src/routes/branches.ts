import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();
router.use(authenticateToken);

// Create branch - Super Admin only
router.post('/', requirePermission('settings', 'create'), async (req, res, next) => {
  try {
    const { name, address, city, state, contactNumber } = req.body;
    const branch = await prisma.branch.create({
      data: { name, address, city, state, contactNumber }
    });
    res.status(201).json(branch);
  } catch (error) {
    next(error);
  }
});

// Get branches
router.get('/', requirePermission('settings', 'view'), async (req, res, next) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { deletedAt: null }
    });
    res.json(branches);
  } catch (error) {
    next(error);
  }
});

export default router;
