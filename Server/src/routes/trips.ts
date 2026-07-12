import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createTripSchema, updateTripSchema, completeTripSchema, dispatchTripSchema } from '../types';

const router = Router();
router.use(authenticateToken);

router.get('/', requirePermission('trips', 'view'), async (req, res, next) => {
  try {
    const { status, vehicleId, driverId } = req.query;
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    
    const where: any = { ...branchFilter, deletedAt: null };
    if (status) where.status = String(status);
    if (vehicleId) where.vehicleId = String(vehicleId);
    if (driverId) where.driverId = String(driverId);

    const trips = await prisma.trip.findMany({ 
      where, 
      include: { 
        vehicle: { select: { registrationNumber: true } }, 
        driver: { select: { name: true } } 
      } 
    });
    res.json(trips);
  } catch (error) {
    next(error);
  }
});

router.post('/', requirePermission('trips', 'create'), validate(createTripSchema), async (req, res, next) => {
  try {
    const branchId = req.user!.role === 'SUPER_ADMIN' ? req.body.branchId : req.user!.branchId!;
    const trip = await prisma.trip.create({
      data: {
        ...req.body,
        branchId,
        createdById: req.user!.userId,
        status: 'DRAFT'
      }
    });
    res.status(201).json(trip);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requirePermission('trips', 'update'), validate(updateTripSchema), async (req, res, next) => {
  try {
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    
    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findFirst({ where: { id: parseInt(req.params.id as string, 10), ...branchFilter, deletedAt: null }});
      if (!trip) throw { statusCode: 404, message: 'Trip not found' };

      if (req.body.cargoWeight && trip.vehicleId) {
        const vehicle = await tx.vehicle.findUnique({ where: { id: trip.vehicleId } });
        if (vehicle && req.body.cargoWeight > vehicle.maxLoadCapacity) {
          throw { statusCode: 400, message: 'Updated cargo weight exceeds assigned vehicle capacity' };
        }
      }

      return tx.trip.update({
        where: { id: trip.id },
        data: req.body
      });
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/dispatch', requirePermission('trips', 'update'), validate(dispatchTripSchema), async (req, res, next) => {
  try {
    const vehicleId = parseInt(req.body.vehicleId, 10);
    const driverId = parseInt(req.body.driverId, 10);
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    
    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findFirst({ where: { id: parseInt(req.params.id as string, 10), ...branchFilter, deletedAt: null } });
      if (!trip) throw { statusCode: 404, message: 'Trip not found' };
      if (trip.status !== 'DRAFT') throw { statusCode: 400, message: 'Only DRAFT trips can be dispatched' };

      const [lockedVehicle]: any[] = await tx.$queryRaw`SELECT id, status, "maxLoadCapacity", "deletedAt" FROM "Vehicle" WHERE id = ${vehicleId} FOR UPDATE`;
      const [lockedDriver]: any[] = await tx.$queryRaw`SELECT id, status, "licenseExpiryDate", "deletedAt" FROM "Driver" WHERE id = ${driverId} FOR UPDATE`;

      if (!lockedVehicle || lockedVehicle.deletedAt) throw { statusCode: 400, message: 'Vehicle not found or deleted' };
      if (!lockedDriver || lockedDriver.deletedAt) throw { statusCode: 400, message: 'Driver not found or deleted' };

      if (lockedVehicle.status !== 'AVAILABLE') throw { statusCode: 400, message: `Vehicle is ${lockedVehicle.status}` };
      if (lockedDriver.status !== 'AVAILABLE') throw { statusCode: 400, message: `Driver cannot be assigned. Status is ${lockedDriver.status} (Not AVAILABLE)` };
      if (new Date(lockedDriver.licenseExpiryDate) < new Date()) throw { statusCode: 400, message: 'Driver license is expired' };
      if (trip.cargoWeight > lockedVehicle.maxLoadCapacity) throw { statusCode: 400, message: 'Capacity exceeded' };

      await tx.vehicle.update({ where: { id: vehicleId }, data: { status: 'ON_TRIP' } });
      await tx.driver.update({ where: { id: driverId }, data: { status: 'ON_TRIP' } });
      
      return tx.trip.update({
        where: { id: trip.id },
        data: { status: 'DISPATCHED', dispatchedAt: new Date(), vehicleId, driverId }
      });
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/complete', requirePermission('trips', 'update'), validate(completeTripSchema), async (req, res, next) => {
  try {
    const { finalOdometer, actualDistance, revenue } = req.body;
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };

    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findFirst({ where: { id: parseInt(req.params.id as string, 10), ...branchFilter, deletedAt: null } });
      if (!trip) throw { statusCode: 404, message: 'Trip not found' };
      if (trip.status !== 'DISPATCHED') throw { statusCode: 400, message: 'Only DISPATCHED trips can be completed' };
      
      await tx.$queryRaw`SELECT id FROM "Vehicle" WHERE id = ${trip.vehicleId} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM "Driver" WHERE id = ${trip.driverId} FOR UPDATE`;

      await tx.vehicle.update({
        where: { id: trip.vehicleId! },
        data: { odometer: finalOdometer, status: 'AVAILABLE' }
      });

      await tx.driver.update({
        where: { id: trip.driverId! },
        data: { status: 'AVAILABLE' }
      });

      return tx.trip.update({
        where: { id: trip.id },
        data: { status: 'COMPLETED', completedAt: new Date(), finalOdometer, actualDistance, revenue }
      });
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/cancel', requirePermission('trips', 'update'), async (req, res, next) => {
  try {
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    
    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findFirst({ where: { id: parseInt(req.params.id as string, 10), ...branchFilter, deletedAt: null } });
      if (!trip) throw { statusCode: 404, message: 'Trip not found' };
      if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') throw { statusCode: 400, message: `Cannot cancel a ${trip.status} trip` };

      if (trip.status === 'DISPATCHED') {
        await tx.$queryRaw`SELECT id FROM "Vehicle" WHERE id = ${trip.vehicleId} FOR UPDATE`;
        await tx.$queryRaw`SELECT id FROM "Driver" WHERE id = ${trip.driverId} FOR UPDATE`;
        
        await tx.vehicle.update({ where: { id: trip.vehicleId! }, data: { status: 'AVAILABLE' } });
        await tx.driver.update({ where: { id: trip.driverId! }, data: { status: 'AVAILABLE' } });
      }

      return tx.trip.update({
        where: { id: trip.id },
        data: { status: 'CANCELLED' }
      });
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requirePermission('trips', 'delete'), async (req, res, next) => {
  try {
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    const trip = await prisma.trip.findFirst({ where: { id: parseInt(req.params.id as string, 10), ...branchFilter, deletedAt: null }});
    if (!trip) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Trip not found' } });
    if (trip.status !== 'DRAFT') return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Only DRAFT trips can be deleted' } });

    await prisma.trip.update({
      where: { id: trip.id },
      data: { deletedAt: new Date() }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
