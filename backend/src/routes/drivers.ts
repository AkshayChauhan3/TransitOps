import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createDriverSchema, updateDriverSchema } from '../types';

const router = Router();

// All driver routes require authentication
router.use(authenticateToken);

// GET /drivers - List all drivers
router.get('/', requirePermission('drivers', 'view'), async (req, res, next) => {
  try {
    const { status } = req.query;
    
    const where: any = {};
    if (status) where.status = String(status);

    const drivers = await prisma.driver.findMany({ where });
    res.json(drivers);
  } catch (error) {
    next(error);
  }
});

// GET /drivers/:id - Get a single driver
router.get('/:id', requirePermission('drivers', 'view'), async (req, res, next) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: {
        trips: { take: 5, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!driver) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Driver not found' } });
    }

    res.json(driver);
  } catch (error) {
    next(error);
  }
});

// POST /drivers - Create a new driver
router.post('/', requirePermission('drivers', 'create'), validate(createDriverSchema), async (req, res, next) => {
  try {
    const driver = await prisma.driver.create({
      data: {
        ...req.body,
        licenseExpiryDate: new Date(req.body.licenseExpiryDate) // Convert string to Date
      }
    });
    res.status(201).json(driver);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: { code: 'DUPLICATE_ENTRY', message: 'License number already exists' } });
    }
    next(error);
  }
});

// PUT /drivers/:id - Update a driver
router.put('/:id', requirePermission('drivers', 'update'), validate(updateDriverSchema), async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (updateData.licenseExpiryDate) {
      updateData.licenseExpiryDate = new Date(updateData.licenseExpiryDate);
    }

    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json(driver);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Driver not found' } });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: { code: 'DUPLICATE_ENTRY', message: 'License number already exists' } });
    }
    next(error);
  }
});

// DELETE /drivers/:id - Delete a driver
router.delete('/:id', requirePermission('drivers', 'delete'), async (req, res, next) => {
  try {
    await prisma.driver.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Driver not found' } });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: { code: 'RESTRICTED', message: 'Cannot delete driver because they are assigned to trips' } });
    }
    next(error);
  }
});

export default router;
