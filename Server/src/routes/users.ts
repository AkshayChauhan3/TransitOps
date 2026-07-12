import { Router } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();
router.use(authenticateToken);

// Get users
router.get('/', requirePermission('users', 'view'), async (req, res, next) => {
  try {
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId };
    const users = await prisma.user.findMany({
      where: { ...branchFilter, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        branch: { select: { name: true } },
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Create user
router.post('/', requirePermission('users', 'create'), async (req, res, next) => {
  try {
    const { email, password, name, role, branchId } = req.body;

    // Role safety validation
    if (req.user!.role !== 'SUPER_ADMIN') {
      // Branch Admin can only create users in their own branch
      if (branchId && Number(branchId) !== req.user!.branchId) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Cannot create user in another branch' } });
      }
      if (role === 'SUPER_ADMIN' || role === 'BRANCH_ADMIN') {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Branch Admins cannot create Admin roles' } });
      }
    }

    const passwordHash = await bcrypt.hash(password || 'password123', 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        branchId: branchId ? Number(branchId) : req.user!.branchId
      }
    });

    res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role, branchId: user.branchId });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: { code: 'DUPLICATE_EMAIL', message: 'Email already exists' } });
    }
    next(error);
  }
});

// Delete user
router.delete('/:id', requirePermission('users', 'delete'), async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId };
    
    const user = await prisma.user.findFirst({
      where: { id: userId, ...branchFilter, deletedAt: null }
    });

    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
