import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

// Cache the Prisma instance in global scope for all environments
// This prevents connection exhaustion on serverless (Vercel)
globalForPrisma.prisma = prisma;

export default prisma;
