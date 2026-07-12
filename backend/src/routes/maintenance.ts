import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { openMaintenanceSchema, closeMaintenanceSchema } from '../types';

const router = Router();
router.use(authenticateToken);

// GET /maintenance - List maintenance logs
router.get('/', requirePermission('fleet', 'view'), async (req, res, next) => {
  try {
    const { status, vehicleId } = req.query;
    const where: any = {};
    if (status) where.status = String(status);
    if (vehicleId) where.vehicleId = String(vehicleId);

    const logs = await prisma.maintenanceLog.findMany({ where, include: { vehicle: true } });
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

// POST /maintenance - Open a maintenance record
router.post('/', requirePermission('fleet', 'create'), validate(openMaintenanceSchema), async (req, res, next) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock the vehicle
      const [vehicle]: any[] = await tx.$queryRaw`SELECT id, status FROM "Vehicle" WHERE id = ${req.body.vehicleId} FOR UPDATE`;
      if (!vehicle) throw { statusCode: 404, message: 'Vehicle not found' };

      // 2. Validate it is AVAILABLE
      if (vehicle.status === 'ON_TRIP' || vehicle.status === 'RETIRED' || vehicle.status === 'IN_SHOP') {
        throw { statusCode: 400, message: `Cannot open maintenance. Vehicle is currently ${vehicle.status}` };
      }

      // 3. Atomically change status to IN_SHOP and create the log
      await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: 'IN_SHOP' } });

      return tx.maintenanceLog.create({
        data: {
          ...req.body,
          date: new Date(req.body.date),
          startedAt: new Date(),
          status: 'ACTIVE'
        }
      });
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// POST /maintenance/:id/close - Close a maintenance record
router.post('/:id/close', requirePermission('fleet', 'update'), validate(closeMaintenanceSchema), async (req, res, next) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.findUnique({ where: { id: req.params.id } });
      if (!log) throw { statusCode: 404, message: 'Maintenance record not found' };
      if (log.status !== 'ACTIVE') throw { statusCode: 400, message: 'This maintenance record is already closed' };

      // 1. Lock the vehicle
      const [vehicle]: any[] = await tx.$queryRaw`SELECT id, status FROM "Vehicle" WHERE id = ${log.vehicleId} FOR UPDATE`;

      // 2. Update the vehicle status to AVAILABLE (unless it was manually retired while in the shop)
      if (vehicle.status !== 'RETIRED') {
        await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: 'AVAILABLE' } });
      }

      // 3. Complete the log
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

export default router;
