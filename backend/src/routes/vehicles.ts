import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createVehicleSchema, updateVehicleSchema } from '../types';

const router = Router();

// All vehicle routes require authentication
router.use(authenticateToken);

// GET /vehicles - List all vehicles (supports ?status=AVAILABLE & ?region=North)
router.get('/', requirePermission('fleet', 'view'), async (req, res, next) => {
  try {
    const { status, region } = req.query;
    
    // Build the query object dynamically based on provided filters
    const where: any = {};
    if (status) where.status = String(status);
    if (region) where.region = String(region);

    const vehicles = await prisma.vehicle.findMany({ where });
    res.json(vehicles);
  } catch (error) {
    next(error);
  }
});

// GET /vehicles/:id - Get a single vehicle
router.get('/:id', requirePermission('fleet', 'view'), async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: {
        trips: { take: 5, orderBy: { createdAt: 'desc' } } // Include 5 recent trips
      }
    });

    if (!vehicle) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
    }

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

// POST /vehicles - Create a new vehicle
router.post('/', requirePermission('fleet', 'create'), validate(createVehicleSchema), async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.create({
      data: req.body
    });
    res.status(201).json(vehicle);
  } catch (error: any) {
    // Handle Prisma unique constraint error (e.g. duplicate registration number)
    if (error.code === 'P2002') {
      return res.status(400).json({ error: { code: 'DUPLICATE_ENTRY', message: 'Registration number already exists' } });
    }
    next(error);
  }
});

// PUT /vehicles/:id - Update a vehicle
router.put('/:id', requirePermission('fleet', 'update'), validate(updateVehicleSchema), async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(vehicle);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: { code: 'DUPLICATE_ENTRY', message: 'Registration number already exists' } });
    }
    next(error);
  }
});

// DELETE /vehicles/:id - Delete a vehicle
router.delete('/:id', requirePermission('fleet', 'delete'), async (req, res, next) => {
  try {
    await prisma.vehicle.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
    }
    // Handle Prisma foreign key constraint error (e.g., trying to delete a vehicle that has trips)
    if (error.code === 'P2003') {
      return res.status(400).json({ error: { code: 'RESTRICTED', message: 'Cannot delete vehicle because it has associated records (trips, maintenance, etc)' } });
    }
    next(error);
  }
});

export default router;
