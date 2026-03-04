import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Test the connection by running a simple command
    await prisma.$connect();
    console.log("✅ Successfully connected to MongoDB!");
    
    // List collections (databases) to verify access
    const result = await prisma.$runCommandRaw({
      ping: 1
    });
    console.log("✅ Database ping successful:", result);
    
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
