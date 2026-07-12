import { PrismaClient } from '@prisma/client';

// We declare a global variable so that in development mode, 
// hot-reloading doesn't create thousands of connections.
declare global {
  var prisma: PrismaClient | undefined;
}

// Create a new Prisma client or use the existing one
export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
