import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createFuelLogSchema, createExpenseSchema } from '../types';

const router = Router();
router.use(authenticateToken);

router.get('/fuel-logs', requirePermission('finance', 'view'), async (req, res, next) => {
  try {
    const { vehicleId, tripId } = req.query;
    // Fuel logs don't have branchId directly, they join via vehicle
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { vehicle: { branchId: req.user!.branchId! } }; 
    
    const where: any = { ...branchFilter, deletedAt: null };
    if (vehicleId) where.vehicleId = String(vehicleId);
    if (tripId) where.tripId = String(tripId);

    const logs = await prisma.fuelLog.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { vehicle: { select: { registrationNumber: true, branchId: true } } }
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

router.post('/fuel-logs', requirePermission('finance', 'create'), validate(createFuelLogSchema), async (req, res, next) => {
  try {
    // Validate vehicle belongs to the branch
    if (req.user!.role !== 'SUPER_ADMIN') {
      const vehicle = await prisma.vehicle.findFirst({ where: { id: req.body.vehicleId, branchId: req.user!.branchId!, deletedAt: null } });
      if (!vehicle) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Vehicle does not belong to your branch' } });
    }

    const log = await prisma.fuelLog.create({
      data: { ...req.body, date: new Date(req.body.date) }
    });
    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
});

router.get('/expenses', requirePermission('finance', 'view'), async (req, res, next) => {
  try {
    const { vehicleId, tripId, type } = req.query;
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { vehicle: { branchId: req.user!.branchId! } };
    
    const where: any = { ...branchFilter, deletedAt: null };
    if (vehicleId) where.vehicleId = String(vehicleId);
    if (tripId) where.tripId = String(tripId);
    if (type) where.type = String(type);

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

router.post('/expenses', requirePermission('finance', 'create'), validate(createExpenseSchema), async (req, res, next) => {
  try {
    if (req.user!.role !== 'SUPER_ADMIN') {
      const vehicle = await prisma.vehicle.findFirst({ where: { id: req.body.vehicleId, branchId: req.user!.branchId!, deletedAt: null } });
      if (!vehicle) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Vehicle does not belong to your branch' } });
    }

    const expense = await prisma.expense.create({
      data: { ...req.body, date: new Date(req.body.date) }
    });
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
});

router.get('/vehicles/:id/operational-cost', requirePermission('finance', 'view'), async (req, res, next) => {
  try {
    const vehicleId = parseInt(req.params.id as string, 10);
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };

    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, ...branchFilter, deletedAt: null } });
    if (!vehicle) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });

    const [fuelCost, maintenanceCost, expensesCost] = await Promise.all([
      prisma.fuelLog.aggregate({ where: { vehicleId, deletedAt: null }, _sum: { cost: true } }),
      prisma.maintenanceLog.aggregate({ where: { vehicleId, deletedAt: null }, _sum: { cost: true } }),
      prisma.expense.aggregate({ where: { vehicleId, deletedAt: null }, _sum: { amount: true } })
    ]);

    const totalFuel = fuelCost._sum?.cost || 0;
    const totalMaintenance = maintenanceCost._sum?.cost || 0;
    const totalExpenses = expensesCost._sum?.amount || 0;

    res.json({
      vehicleId,
      breakdown: { fuel: totalFuel, maintenance: totalMaintenance, otherExpenses: totalExpenses },
      totalOperationalCost: totalFuel + totalMaintenance + totalExpenses
    });
  } catch (error) {
    next(error);
  }
});

export default router;
