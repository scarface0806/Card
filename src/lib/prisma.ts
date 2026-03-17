import { PrismaClient } from "@prisma/client";
import { getRequiredEnv } from "@/lib/env";

// Fail fast with a clear message when DATABASE_URL is missing.
getRequiredEnv("DATABASE_URL");

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
