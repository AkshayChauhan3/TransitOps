import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createVehicleSchema, updateVehicleSchema } from '../types';

const router = Router();
router.use(authenticateToken);

router.get('/', requirePermission('fleet', 'view'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    
    const where: any = { ...branchFilter, deletedAt: null };
    if (status) where.status = String(status);

    const vehicles = await prisma.vehicle.findMany({ where });
    res.json(vehicles);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requirePermission('fleet', 'view'), async (req, res, next) => {
  try {
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: parseInt(req.params.id as string), ...branchFilter, deletedAt: null },
      include: {
        trips: { 
          where: { deletedAt: null },
          take: 5, 
          orderBy: { createdAt: 'desc' } 
        }
      }
    });

    if (!vehicle) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

router.post('/', requirePermission('fleet', 'create'), validate(createVehicleSchema), async (req, res, next) => {
  try {
    const branchId = req.user!.role === 'SUPER_ADMIN' ? req.body.branchId : req.user!.branchId!;
    const vehicle = await prisma.vehicle.create({
      data: { ...req.body, branchId }
    });
    res.status(201).json(vehicle);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: { code: 'DUPLICATE_ENTRY', message: 'Registration number already exists' } });
    next(error);
  }
});

router.put('/:id', requirePermission('fleet', 'update'), validate(updateVehicleSchema), async (req, res, next) => {
  try {
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    const vehicle = await prisma.vehicle.findFirst({ where: { id: parseInt(req.params.id as string), ...branchFilter, deletedAt: null }});
    if (!vehicle) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });

    const updated = await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: req.body
    });
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: { code: 'DUPLICATE_ENTRY', message: 'Registration number already exists' } });
    next(error);
  }
});

router.delete('/:id', requirePermission('fleet', 'delete'), async (req, res, next) => {
  try {
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    const vehicle = await prisma.vehicle.findFirst({ where: { id: parseInt(req.params.id as string), ...branchFilter, deletedAt: null }});
    if (!vehicle) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });

    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { deletedAt: new Date() }
    });
    res.status(204).send();
  } catch (error: any) {
    next(error);
  }
});

export default router;
