import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app = express();
app.use(cors());
app.use(express.json());

// Mock Token Middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization token required' });
  }
  req.user = { id: 'u1', role: 'MANAGER' };
  next();
};

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  res.json({ token: 'u1', user: { id: 'u1', name: 'Manager', email, role: 'MANAGER' } });
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  res.json({ id: 'u1', name: 'Manager', email: 'manager@transitops.com', role: 'MANAGER' });
});

app.get('/api/dashboard', authenticate, async (req, res) => {
  try {
    const [vehicles, drivers, trips, expenses] = await Promise.all([
      prisma.vehicle.findMany(),
      prisma.driver.findMany(),
      prisma.trip.findMany(),
      prisma.expense.findMany()
    ]);

    const activeVehicles = vehicles.filter(v => v.status === 'ON_TRIP').length;
    const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
    const vehiclesInMaintenance = vehicles.filter(v => v.status === 'IN_SHOP').length;
    const activeTrips = trips.filter(t => t.status === 'DISPATCHED' || t.status === 'IN_PROGRESS').length;
    const pendingTrips = trips.filter(t => t.status === 'DRAFT').length;
    const driversOnDuty = drivers.filter(d => ['AVAILABLE', 'ON_TRIP'].includes(d.status)).length;
    
    const totalActiveFleet = vehicles.filter(v => v.status !== 'RETIRED').length;
    const fleetUtilizationPercent = totalActiveFleet > 0 ? Math.round((activeVehicles / totalActiveFleet) * 100) : 0;

    const totalFuel = expenses.filter(e => e.type === 'FUEL').reduce((acc, log) => acc + (log.amount || 0), 0) * 0.264172; // Convert liters to gallons if amount is liters
    const totalRevenue = trips.reduce((acc, t) => acc + 1000, 0); // Mock revenue
    const alertsCount = expenses.filter(e => e.type === 'MAINTENANCE').length; // Mock alerts count

    res.json({ activeVehicles, availableVehicles, vehiclesInMaintenance, activeTrips, pendingTrips, driversOnDuty, fleetUtilizationPercent, totalFuel: Math.round(totalFuel), totalRevenue, alertsCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Vehicles
app.get('/api/vehicles', authenticate, async (req, res) => {
  const vehicles = await prisma.vehicle.findMany();
  res.json(vehicles);
});

app.post('/api/vehicles', authenticate, async (req, res) => {
  try {
    const v = await prisma.vehicle.create({ data: req.body });
    res.json(v);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/vehicles/:id', authenticate, async (req, res) => {
  try {
    const v = await prisma.vehicle.update({ where: { id: req.params.id }, data: req.body });
    res.json(v);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/vehicles/:id', authenticate, async (req, res) => {
  await prisma.vehicle.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Drivers
app.get('/api/drivers', authenticate, async (req, res) => {
  const drivers = await prisma.driver.findMany();
  res.json(drivers);
});

app.post('/api/drivers', authenticate, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.licenseExpiry) data.licenseExpiry = new Date(data.licenseExpiry);
    const d = await prisma.driver.create({ data });
    res.json(d);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/drivers/:id', authenticate, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.licenseExpiry) data.licenseExpiry = new Date(data.licenseExpiry);
    const d = await prisma.driver.update({ where: { id: req.params.id }, data });
    res.json(d);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/drivers/:id', authenticate, async (req, res) => {
  await prisma.driver.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Trips
app.get('/api/trips', authenticate, async (req, res) => {
  const trips = await prisma.trip.findMany({ include: { vehicle: true, driver: true } });
  res.json(trips);
});

app.post('/api/trips', authenticate, async (req, res) => {
  try {
    const { source, destination, vehicleId, driverId, cargoWeight, distance } = req.body;
    const tripNumber = 'TR-' + Date.now();
    const t = await prisma.trip.create({ 
      data: {
        tripNumber,
        source,
        destination,
        vehicleId: vehicleId || null,
        driverId: driverId || null,
        cargoWeight: parseFloat(cargoWeight) || 0,
        distance: parseFloat(distance) || 0,
        status: 'DRAFT'
      } 
    });
    res.json(t);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/trips/:id/dispatch', authenticate, async (req, res) => {
  try {
    const t = await prisma.trip.update({ 
      where: { id: req.params.id }, 
      data: { status: 'DISPATCHED', startTime: new Date() } 
    });
    res.json(t);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/trips/:id/cancel', authenticate, async (req, res) => {
  try {
    const t = await prisma.trip.update({ 
      where: { id: req.params.id }, 
      data: { status: 'CANCELLED' } 
    });
    res.json(t);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/trips/:id/complete', authenticate, async (req, res) => {
  try {
    const { endOdometer, fuelConsumed } = req.body;
    const t = await prisma.trip.update({ 
      where: { id: req.params.id }, 
      data: { 
        status: 'COMPLETED', 
        endTime: new Date(), 
        endOdometer: parseFloat(endOdometer),
        fuelConsumed: parseFloat(fuelConsumed)
      } 
    });
    res.json(t);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Reports
app.get('/api/reports/vehicles', authenticate, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany();
    const reports = vehicles.map(v => {
      const seed = v.id.length + v.registrationNumber.charCodeAt(0);
      return {
        id: v.id,
        registrationNumber: v.registrationNumber,
        model: v.model || 'Unknown',
        fuelEfficiency: 8 + (seed % 5) + Math.random(), 
        fleetUtilizationPercent: 40 + (seed % 50), 
        operationalCost: 1200 + (seed * 10),
        roi: 0.8 + (seed % 10) / 10 + Math.random() * 0.5
      };
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/reports/vehicles/export.csv', authenticate, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany();
    const reports = vehicles.map(v => {
      const seed = v.id.length + v.registrationNumber.charCodeAt(0);
      return {
        id: v.id,
        registrationNumber: v.registrationNumber,
        model: v.model || 'Unknown',
        fuelEfficiency: (8 + (seed % 5) + Math.random()).toFixed(2),
        fleetUtilizationPercent: 40 + (seed % 50),
        operationalCost: (1200 + (seed * 10)).toFixed(2),
        roi: (0.8 + (seed % 10) / 10 + Math.random() * 0.5).toFixed(2)
      };
    });

    const headers = ['ID', 'Registration Number', 'Model', 'Fuel Efficiency (km/L)', 'Utilization (%)', 'Operational Cost ($)', 'ROI'];
    const csvRows = [headers.join(',')];
    
    for (const row of reports) {
      csvRows.push([
        row.id,
        `"${row.registrationNumber}"`,
        `"${row.model}"`,
        row.fuelEfficiency,
        row.fleetUtilizationPercent,
        row.operationalCost,
        row.roi
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="reports.csv"');
    res.send(csvRows.join('\n'));
  } catch (err) {
    res.status(500).send('Error generating CSV');
  }
});

app.listen(5000, () => console.log('Prisma API server running on port 5000'));
