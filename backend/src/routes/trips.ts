import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createTripSchema, updateTripSchema, completeTripSchema } from '../types';

const router = Router();
router.use(authenticateToken);

// GET /trips - List/filter trips
router.get('/', requirePermission('trips', 'view'), async (req, res, next) => {
  try {
    const { status, vehicleId, driverId } = req.query;
    const where: any = {};
    if (status) where.status = String(status);
    if (vehicleId) where.vehicleId = String(vehicleId);
    if (driverId) where.driverId = String(driverId);

    const trips = await prisma.trip.findMany({ where, include: { vehicle: true, driver: true } });
    res.json(trips);
  } catch (error) {
    next(error);
  }
});

// POST /trips - Create a draft trip
router.post('/', requirePermission('trips', 'create'), validate(createTripSchema), async (req, res, next) => {
  try {
    const trip = await prisma.trip.create({
      data: {
        ...req.body,
        createdById: req.user!.userId,
        status: 'DRAFT'
      }
    });
    res.status(201).json(trip);
  } catch (error) {
    next(error);
  }
});

// POST /trips/:id/dispatch - Dispatch a trip (Complex Transaction)
router.post('/:id/dispatch', requirePermission('trips', 'update'), async (req, res, next) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch trip and ensure it's a DRAFT
      const trip = await tx.trip.findUnique({ where: { id: req.params.id } });
      if (!trip) throw { statusCode: 404, message: 'Trip not found' };
      if (trip.status !== 'DRAFT') throw { statusCode: 400, message: 'Only DRAFT trips can be dispatched' };
      if (!trip.vehicleId || !trip.driverId) throw { statusCode: 400, message: 'Vehicle and Driver must be assigned before dispatch' };

      // 2. Lock the specific Vehicle and Driver rows (Concurrency control)
      const [lockedVehicle]: any[] = await tx.$queryRaw`SELECT id, status, "maxLoadCapacity" FROM "Vehicle" WHERE id = ${trip.vehicleId} FOR UPDATE`;
      const [lockedDriver]: any[] = await tx.$queryRaw`SELECT id, status, "licenseExpiryDate" FROM "Driver" WHERE id = ${trip.driverId} FOR UPDATE`;

      if (!lockedVehicle || !lockedDriver) throw { statusCode: 400, message: 'Vehicle or Driver not found' };

      // 3. Apply Business Rules
      if (lockedVehicle.status !== 'AVAILABLE') throw { statusCode: 400, message: `Vehicle is ${lockedVehicle.status}, must be AVAILABLE` };
      if (lockedDriver.status !== 'AVAILABLE') throw { statusCode: 400, message: `Driver is ${lockedDriver.status}, must be AVAILABLE` };
      if (new Date(lockedDriver.licenseExpiryDate) < new Date()) throw { statusCode: 400, message: 'Driver license is expired' };
      
      if (trip.cargoWeight > lockedVehicle.maxLoadCapacity) {
        const overage = trip.cargoWeight - lockedVehicle.maxLoadCapacity;
        throw { statusCode: 400, message: `Vehicle Capacity: ${lockedVehicle.maxLoadCapacity} kg, Cargo Weight: ${trip.cargoWeight} kg -> Capacity exceeded by ${overage} kg - dispatch blocked` };
      }

      // 4. Cascade Status Changes Atomically
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'ON_TRIP' } });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: 'ON_TRIP' } });
      
      const updatedTrip = await tx.trip.update({
        where: { id: trip.id },
        data: { status: 'DISPATCHED', dispatchedAt: new Date() }
      });

      return updatedTrip;
    });

    res.json(result);
  } catch (error: any) {
    next(error); // Passes the custom thrown errors to errorHandler.ts
  }
});

// POST /trips/:id/complete - Complete a trip
router.post('/:id/complete', requirePermission('trips', 'update'), validate(completeTripSchema), async (req, res, next) => {
  try {
    const { finalOdometer, fuelConsumed, actualDistance, revenue } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: req.params.id } });
      if (!trip) throw { statusCode: 404, message: 'Trip not found' };
      if (trip.status !== 'DISPATCHED') throw { statusCode: 400, message: 'Only DISPATCHED trips can be completed' };
      
      // We know vehicleId exists because it was checked during dispatch
      await tx.$queryRaw`SELECT id FROM "Vehicle" WHERE id = ${trip.vehicleId} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM "Driver" WHERE id = ${trip.driverId} FOR UPDATE`;

      // 1. Update vehicle odometer
      const vehicle = await tx.vehicle.update({
        where: { id: trip.vehicleId! },
        data: { odometer: finalOdometer, status: 'AVAILABLE' }
      });

      // 2. Free up the driver
      await tx.driver.update({
        where: { id: trip.driverId! },
        data: { status: 'AVAILABLE' }
      });

      // 3. Auto-create FuelLog
      const costPerLiter = 100; // Hardcoded fallback or we could fetch from settings
      await tx.fuelLog.create({
        data: {
          vehicleId: vehicle.id,
          tripId: trip.id,
          liters: fuelConsumed,
          cost: fuelConsumed * costPerLiter,
          date: new Date()
        }
      });

      // 4. Complete the trip
      return tx.trip.update({
        where: { id: trip.id },
        data: { status: 'COMPLETED', completedAt: new Date(), finalOdometer, fuelConsumed, actualDistance, revenue }
      });
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /trips/:id/cancel
router.post('/:id/cancel', requirePermission('trips', 'update'), async (req, res, next) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: req.params.id } });
      if (!trip) throw { statusCode: 404, message: 'Trip not found' };
      if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') throw { statusCode: 400, message: `Cannot cancel a ${trip.status} trip` };

      // If it was dispatched, we must revert the vehicle and driver back to AVAILABLE
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

export default router;
