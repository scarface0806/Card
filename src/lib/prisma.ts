import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL?.trim()) {
  throw new Error("Missing environment variable");
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production")
  globalForPrisma.prisma = prisma;

export default prisma;
