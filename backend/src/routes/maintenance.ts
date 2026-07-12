import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { openMaintenanceSchema, closeMaintenanceSchema } from '../types';

const router = Router();
router.use(authenticateToken);

router.get('/', requirePermission('fleet', 'view'), async (req, res, next) => {
  try {
    const { status, vehicleId } = req.query;
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    
    const where: any = { ...branchFilter, deletedAt: null };
    if (status) where.status = String(status);
    if (vehicleId) where.vehicleId = String(vehicleId);

    const logs = await prisma.maintenanceLog.findMany({ where, include: { vehicle: true } });
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

router.post('/', requirePermission('fleet', 'create'), validate(openMaintenanceSchema), async (req, res, next) => {
  try {
    const branchId = req.user!.role === 'SUPER_ADMIN' ? req.body.branchId : req.user!.branchId!;
    
    const result = await prisma.$transaction(async (tx) => {
      const [vehicle]: any[] = await tx.$queryRaw`SELECT id, status, "deletedAt", "branchId" FROM "Vehicle" WHERE id = ${req.body.vehicleId} FOR UPDATE`;
      if (!vehicle || vehicle.deletedAt || vehicle.branchId !== branchId) throw { statusCode: 404, message: 'Vehicle not found or does not belong to branch' };

      if (vehicle.status === 'ON_TRIP' || vehicle.status === 'RETIRED' || vehicle.status === 'IN_SHOP') {
        throw { statusCode: 400, message: `Cannot open maintenance. Vehicle is currently ${vehicle.status}` };
      }

      await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: 'IN_SHOP' } });

      return tx.maintenanceLog.create({
        data: {
          ...req.body,
          branchId,
          date: new Date(req.body.date),
          startedAt: new Date(),
          status: 'PENDING'
        }
      });
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/close', requirePermission('fleet', 'update'), validate(closeMaintenanceSchema), async (req, res, next) => {
  try {
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };

    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.findFirst({ where: { id: req.params.id, ...branchFilter, deletedAt: null } });
      if (!log) throw { statusCode: 404, message: 'Maintenance record not found' };
      if (log.status === 'COMPLETED') throw { statusCode: 400, message: 'Already closed' };

      const [vehicle]: any[] = await tx.$queryRaw`SELECT id, status FROM "Vehicle" WHERE id = ${log.vehicleId} FOR UPDATE`;

      if (vehicle.status !== 'RETIRED') {
        await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: 'AVAILABLE' } });
      }

      return tx.maintenanceLog.update({
        where: { id: log.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          technicianName: req.body.technicianName
        }
      });
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requirePermission('fleet', 'delete'), async (req, res, next) => {
  try {
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    const log = await prisma.maintenanceLog.findFirst({ where: { id: req.params.id, ...branchFilter, deletedAt: null }});
    if (!log) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Record not found' } });

    await prisma.maintenanceLog.update({
      where: { id: log.id },
      data: { deletedAt: new Date() }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
