import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createFuelLogSchema, createExpenseSchema } from '../types';

const router = Router();
router.use(authenticateToken);

// ==========================================
// FUEL LOGS
// ==========================================

// GET /fuel-logs
router.get('/fuel-logs', requirePermission('finance', 'view'), async (req, res, next) => {
  try {
    const { vehicleId, tripId } = req.query;
    const where: any = {};
    if (vehicleId) where.vehicleId = String(vehicleId);
    if (tripId) where.tripId = String(tripId);

    const logs = await prisma.fuelLog.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { vehicle: { select: { registrationNumber: true } } }
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

// POST /fuel-logs (Manual entry - trip completions do this automatically)
router.post('/fuel-logs', requirePermission('finance', 'create'), validate(createFuelLogSchema), async (req, res, next) => {
  try {
    const log = await prisma.fuelLog.create({
      data: {
        ...req.body,
        date: new Date(req.body.date)
      }
    });
    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// EXPENSES (Tolls, Fines, etc.)
// ==========================================

// GET /expenses
router.get('/expenses', requirePermission('finance', 'view'), async (req, res, next) => {
  try {
    const { vehicleId, tripId, type } = req.query;
    const where: any = {};
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

// POST /expenses
router.post('/expenses', requirePermission('finance', 'create'), validate(createExpenseSchema), async (req, res, next) => {
  try {
    const expense = await prisma.expense.create({
      data: {
        ...req.body,
        date: new Date(req.body.date)
      }
    });
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// AGGREGATED OPERATIONAL COST
// ==========================================

// GET /vehicles/:id/operational-cost
router.get('/vehicles/:id/operational-cost', requirePermission('finance', 'view'), async (req, res, next) => {
  try {
    const vehicleId = req.params.id;

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
    }

    // Run aggregations concurrently
    const [fuelCost, maintenanceCost, expensesCost] = await Promise.all([
      prisma.fuelLog.aggregate({
        where: { vehicleId },
        _sum: { cost: true }
      }),
      prisma.maintenanceLog.aggregate({
        where: { vehicleId },
        _sum: { cost: true }
      }),
      prisma.expense.aggregate({
        where: { vehicleId },
        _sum: { amount: true }
      })
    ]);

    const totalFuel = fuelCost._sum.cost || 0;
    const totalMaintenance = maintenanceCost._sum.cost || 0;
    const totalExpenses = expensesCost._sum.amount || 0;

    res.json({
      vehicleId,
      breakdown: {
        fuel: totalFuel,
        maintenance: totalMaintenance,
        otherExpenses: totalExpenses
      },
      totalOperationalCost: totalFuel + totalMaintenance + totalExpenses
    });
  } catch (error) {
    next(error);
  }
});

export default router;
