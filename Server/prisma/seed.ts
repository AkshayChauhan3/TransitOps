import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@transitops.com' },
    update: {},
    create: {
      email: 'super@transitops.com',
      name: 'Global System Admin',
      passwordHash,
      role: 'SUPER_ADMIN'
    }
  });
  console.log(`Created Super Admin: ${superAdmin.email}`);

  // Create a default branch
  const branch = await prisma.branch.create({
    data: {
      name: 'Vadodara Hub',
      address: '123 Transport Lane',
      city: 'Vadodara',
      state: 'Gujarat',
      contactNumber: '+91 9999999999'
    }
  });
  console.log(`Created Branch: ${branch.name}`);

  // Create Branch Admin
  const branchAdmin = await prisma.user.upsert({
    where: { email: 'admin@vadodara.com' },
    update: {},
    create: {
      email: 'admin@vadodara.com',
      name: 'Vadodara Manager',
      passwordHash,
      role: 'BRANCH_ADMIN',
      branchId: branch.id
    }
  });
  console.log(`Created Branch Admin: ${branchAdmin.email}`);

  // Create Fleet Manager
  await prisma.user.upsert({
    where: { email: 'fleet@vadodara.com' },
    update: {},
    create: {
      email: 'fleet@vadodara.com',
      name: 'Vadodara Fleet Manager',
      passwordHash,
      role: 'FLEET_MANAGER',
      branchId: branch.id
    }
  });

  // Create Dispatcher
  await prisma.user.upsert({
    where: { email: 'dispatch@vadodara.com' },
    update: {},
    create: {
      email: 'dispatch@vadodara.com',
      name: 'Vadodara Dispatcher',
      passwordHash,
      role: 'DISPATCHER',
      branchId: branch.id
    }
  });

  // Create Vehicle
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

  // Create Driver
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
