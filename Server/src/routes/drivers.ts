import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createDriverSchema, updateDriverSchema } from '../types';

const router = Router();
router.use(authenticateToken);

router.get('/', requirePermission('drivers', 'view'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    
    const where: any = { ...branchFilter, deletedAt: null };
    if (status) where.status = String(status);

    const drivers = await prisma.driver.findMany({ where });
    res.json(drivers);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requirePermission('drivers', 'view'), async (req, res, next) => {
  try {
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    const driver = await prisma.driver.findFirst({
      where: { id: parseInt(req.params.id as string, 10), ...branchFilter, deletedAt: null },
      include: {
        trips: { where: { deletedAt: null }, take: 5, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!driver) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Driver not found' } });
    res.json(driver);
  } catch (error) {
    next(error);
  }
});

router.post('/', requirePermission('drivers', 'create'), validate(createDriverSchema), async (req, res, next) => {
  try {
    const branchId = req.user!.role === 'SUPER_ADMIN' ? req.body.branchId : req.user!.branchId!;
    const driver = await prisma.driver.create({
      data: {
        ...req.body,
        branchId,
        licenseExpiryDate: new Date(req.body.licenseExpiryDate)
      }
    });
    res.status(201).json(driver);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: { code: 'DUPLICATE_ENTRY', message: 'License number already exists' } });
    next(error);
  }
});

router.put('/:id', requirePermission('drivers', 'update'), validate(updateDriverSchema), async (req, res, next) => {
  try {
    const driver = await prisma.driver.findFirst({ where: { id: parseInt(req.params.id as string, 10), deletedAt: null }});
    if (!driver) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Driver not found' } });
    if (req.user!.role !== 'SUPER_ADMIN' && driver.branchId !== req.user!.branchId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized to modify this branch resource' } });
    }

    const updateData = { ...req.body };
    if (updateData.licenseExpiryDate) updateData.licenseExpiryDate = new Date(updateData.licenseExpiryDate);

    const updated = await prisma.driver.update({
      where: { id: driver.id },
      data: updateData
    });
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: { code: 'DUPLICATE_ENTRY', message: 'License number already exists' } });
    next(error);
  }
});

router.delete('/:id', requirePermission('drivers', 'delete'), async (req, res, next) => {
  try {
    const driver = await prisma.driver.findFirst({ where: { id: parseInt(req.params.id as string, 10), deletedAt: null }});
    if (!driver) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Driver not found' } });
    if (req.user!.role !== 'SUPER_ADMIN' && driver.branchId !== req.user!.branchId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized to delete this branch resource' } });
    }

    await prisma.driver.update({
      where: { id: driver.id },
      data: { deletedAt: new Date() }
    });
    res.status(204).send();
  } catch (error: any) {
    next(error);
  }
});

export default router;
