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
  // Hardcoded for now since mock-server login returns token 'u1'
  req.user = { id: 'u1', role: 'FLEET_MANAGER' };
  next();
};

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  res.json({ token: 'u1', user: { id: 'u1', name: 'Fleet Manager', email, role: 'FLEET_MANAGER' } });
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  res.json({ id: 'u1', name: 'Fleet Manager', email: 'manager@transitops.com', role: 'FLEET_MANAGER' });
});

app.get('/api/dashboard', authenticate, async (req, res) => {
  const [vehicles, drivers, trips] = await Promise.all([
    prisma.vehicle.findMany(),
    prisma.driver.findMany(),
    prisma.trip.findMany()
  ]);

  const activeVehicles = vehicles.filter(v => v.status === 'ON_TRIP').length;
  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const vehiclesInMaintenance = vehicles.filter(v => v.status === 'IN_SHOP').length;
  const activeTrips = trips.filter(t => t.status === 'DISPATCHED').length;
  const pendingTrips = trips.filter(t => t.status === 'DRAFT').length;
  const driversOnDuty = drivers.filter(d => ['AVAILABLE', 'ON_TRIP'].includes(d.status)).length;
  
  const totalActiveFleet = vehicles.filter(v => v.status !== 'RETIRED').length;
  const fleetUtilizationPercent = totalActiveFleet > 0 ? Math.round((activeVehicles / totalActiveFleet) * 100) : 0;

  res.json({ activeVehicles, availableVehicles, vehiclesInMaintenance, activeTrips, pendingTrips, driversOnDuty, fleetUtilizationPercent });
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
    req.body.tripNumber = 'TR-' + Date.now();
    const t = await prisma.trip.create({ data: req.body });
    res.json(t);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.listen(5000, () => console.log('Prisma API server running on port 5000'));
