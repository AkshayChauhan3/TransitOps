import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();
router.use(authenticateToken);

router.get('/kpis', requirePermission('analytics', 'view'), async (req, res, next) => {
  try {
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    
    const baseWhere = { ...branchFilter, deletedAt: null };

    const [
      totalVehicles, activeVehicles, inShopVehicles,
      activeTrips, pendingTrips, driversOnDuty
    ] = await Promise.all([
      prisma.vehicle.count({ where: baseWhere }),
      prisma.vehicle.count({ where: { ...baseWhere, status: 'ON_TRIP' } }),
      prisma.vehicle.count({ where: { ...baseWhere, status: 'IN_SHOP' } }),
      prisma.trip.count({ where: { ...baseWhere, status: 'DISPATCHED' } }),
      prisma.trip.count({ where: { ...baseWhere, status: 'DRAFT' } }),
      prisma.driver.count({ where: { ...baseWhere, status: 'ON_TRIP' } })
    ]);

    const fleetUtilization = totalVehicles > 0 ? Number(((activeVehicles / totalVehicles) * 100).toFixed(1)) : 0;

    res.json({
      fleet: { total: totalVehicles, active: activeVehicles, inMaintenance: inShopVehicles, utilizationPercentage: fleetUtilization },
      trips: { active: activeTrips, pending: pendingTrips },
      drivers: { onDuty: driversOnDuty }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/recent-trips', requirePermission('analytics', 'view'), async (req, res, next) => {
  try {
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    const recentTrips = await prisma.trip.findMany({
      where: { ...branchFilter, deletedAt: null },
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: { vehicle: { select: { registrationNumber: true } }, driver: { select: { name: true } } }
    });
    res.json(recentTrips);
  } catch (error) {
    next(error);
  }
});

router.get('/alerts', requirePermission('analytics', 'view'), async (req, res, next) => {
  try {
    const today = new Date();
    const branchFilter = req.user!.role === 'SUPER_ADMIN' ? {} : { branchId: req.user!.branchId! };
    const baseWhere = { ...branchFilter, deletedAt: null };

    const [expiringLicenses, overdueMaintenance, lockedAccounts] = await Promise.all([
      prisma.driver.findMany({
        where: { ...baseWhere, licenseExpiryDate: { lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) } },
        select: { id: true, name: true, licenseExpiryDate: true }
      }),
      prisma.maintenanceLog.findMany({
        where: { 
          ...baseWhere, 
          status: 'IN_PROGRESS', 
          startedAt: { lte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
        },
        include: { vehicle: { select: { registrationNumber: true } } }
      }),
      prisma.user.findMany({
        where: { ...branchFilter, deletedAt: null, lockedUntil: { gt: today } },
        select: { id: true, email: true, name: true, lockedUntil: true }
      })
    ]);

    res.json({ expiringLicenses, overdueMaintenance, lockedAccounts });
  } catch (error) {
    next(error);
  }
});

export default router;
