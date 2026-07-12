import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { parse } from 'json2csv';

const router = Router();
router.use(authenticateToken);

// Helper for CSV export
const exportOrJson = (req: any, res: any, data: any[], filename: string) => {
  if (req.query.format === 'csv') {
    try {
      const csv = parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment(`${filename}.csv`);
      return res.send(csv);
    } catch (err) {
      return res.status(500).json({ error: { code: 'EXPORT_FAILED', message: 'Failed to generate CSV' } });
    }
  }
  return res.json(data);
};

// GET /reports/fuel-efficiency
router.get('/fuel-efficiency', requirePermission('analytics', 'view'), async (req, res, next) => {
  try {
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    
    const trips = await prisma.trip.findMany({
      where: { ...branchFilter, status: 'COMPLETED', deletedAt: null },
      include: { vehicle: { select: { registrationNumber: true } } }
    });

    const data = trips.map(t => ({
      tripId: t.id,
      vehicle: t.vehicle?.registrationNumber,
      distance: t.actualDistance || 0,
      fuelConsumed: t.fuelConsumed || 0,
      efficiencyKmPerLiter: t.fuelConsumed ? Number(((t.actualDistance || 0) / t.fuelConsumed).toFixed(2)) : 0
    }));

    exportOrJson(req, res, data, 'fuel_efficiency');
  } catch (error) {
    next(error);
  }
});

// GET /reports/roi (per vehicle)
router.get('/roi', requirePermission('analytics', 'view'), async (req, res, next) => {
  try {
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    
    // Aggregation of total revenue vs total operational costs
    const vehicles = await prisma.vehicle.findMany({
      where: { ...branchFilter, deletedAt: null },
      include: {
        trips: { where: { status: 'COMPLETED', deletedAt: null }, select: { revenue: true } },
        maintenanceLogs: { where: { deletedAt: null }, select: { cost: true } },
        fuelLogs: { where: { deletedAt: null }, select: { cost: true } },
        expenses: { where: { deletedAt: null }, select: { amount: true } }
      }
    });

    const data = vehicles.map(v => {
      const totalRevenue = v.trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
      
      const totalCosts = 
        v.maintenanceLogs.reduce((sum, m) => sum + m.cost, 0) +
        v.fuelLogs.reduce((sum, f) => sum + f.cost, 0) +
        v.expenses.reduce((sum, e) => sum + e.amount, 0);

      const netProfit = totalRevenue - totalCosts;
      const roiPercentage = v.acquisitionCost > 0 ? (netProfit / v.acquisitionCost) * 100 : 0;

      return {
        vehicleId: v.id,
        registration: v.registrationNumber,
        acquisitionCost: v.acquisitionCost,
        totalRevenue,
        totalCosts,
        netProfit,
        roiPercentage: Number(roiPercentage.toFixed(2))
      };
    });

    // Sort by most profitable
    data.sort((a, b) => b.roiPercentage - a.roiPercentage);

    exportOrJson(req, res, data, 'roi_report');
  } catch (error) {
    next(error);
  }
});

export default router;
