import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Create Super Admin (skip if already exists)
  let superAdmin = await prisma.user.findFirst({ where: { email: 'super@transitops.com' } });
  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        email: 'super@transitops.com',
        name: 'Global System Admin',
        passwordHash,
        role: 'SUPER_ADMIN'
      }
    });
  }
  console.log(`Super Admin ready: ${superAdmin.email} (id: ${superAdmin.id})`);

  // Create a default branch (skip if already exists)
  let branch = await prisma.branch.findFirst({ where: { name: 'Vadodara Hub' } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'Vadodara Hub',
        address: '123 Transport Lane',
        city: 'Vadodara',
        state: 'Gujarat',
        contactNumber: '+91 9999999999'
      }
    });
  }
  console.log(`Branch ready: ${branch.name} (id: ${branch.id})`);

  // Create Branch Admin (skip if already exists)
  const branchAdmin = await prisma.user.findFirst({ where: { email: 'admin@vadodara.com' } });
  if (!branchAdmin) {
    await prisma.user.create({
      data: {
        email: 'admin@vadodara.com',
        name: 'Vadodara Manager',
        passwordHash,
        role: 'BRANCH_ADMIN',
        branchId: branch.id
      }
    });
  }
  console.log(`Branch Admin ready: admin@vadodara.com`);

  // Create Fleet Manager (skip if already exists)
  const fleetManager = await prisma.user.findFirst({ where: { email: 'fleet@vadodara.com' } });
  if (!fleetManager) {
    await prisma.user.create({
      data: {
        email: 'fleet@vadodara.com',
        name: 'Vadodara Fleet Manager',
        passwordHash,
        role: 'FLEET_MANAGER',
        branchId: branch.id
      }
    });
  }

  // Create Dispatcher (skip if already exists)
  const dispatcher = await prisma.user.findFirst({ where: { email: 'dispatch@vadodara.com' } });
  if (!dispatcher) {
    await prisma.user.create({
      data: {
        email: 'dispatch@vadodara.com',
        name: 'Vadodara Dispatcher',
        passwordHash,
        role: 'DISPATCHER',
        branchId: branch.id
      }
    });
  }

  // Create Vehicle (skip if already exists)
  const vehicle = await prisma.vehicle.findFirst({ where: { registrationNumber: 'GJ06-AB-1234' } });
  if (!vehicle) {
    await prisma.vehicle.create({
      data: {
        registrationNumber: 'GJ06-AB-1234',
        name: 'Tata Ace Gold',
        model: '2023',
        type: 'Mini Truck',
        maxLoadCapacity: 750,
        odometer: 1500,
        acquisitionCost: 550000,
        status: 'AVAILABLE',
        branchId: branch.id
      }
    });
  }

  // Create Driver (skip if already exists)
  const driver = await prisma.driver.findFirst({ where: { licenseNumber: 'GJ0619901234567' } });
  if (!driver) {
    await prisma.driver.create({
      data: {
        name: 'Rajesh Kumar',
        licenseNumber: 'GJ0619901234567',
        licenseCategory: 'LMV',
        licenseExpiryDate: new Date('2030-01-01'),
        contactNumber: '+91 8888888888',
        safetyScore: 95,
        status: 'AVAILABLE',
        branchId: branch.id
      }
    });
  }

  console.log('Seeding Completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
