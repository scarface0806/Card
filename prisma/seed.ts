import { PrismaClient } from "@prisma/client";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Admin credentials: read from env vars with fallbacks for convenience
// Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local before running seed
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim() || "santhoshuxui2023@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim() || "KGTPS6565P";
const BCRYPT_ROUNDS = 12; // Match the rounds used in auth endpoints

async function createAdmin() {
  try {
    console.log("\n🔐 Starting admin user seed...\n");

    // Hash password with bcryptjs
    console.log("🔒 Hashing password...");
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

    // Upsert: update if exists, create if not
    const admin = await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: {
        password: hashedPassword,
        role: Role.ADMIN,
        isActive: true,
        emailVerified: true,
      },
      create: {
        name: "Admin",
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: Role.ADMIN,
        isActive: true,
        emailVerified: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Log success
    console.log("\n" + "=".repeat(60));
    console.log("✅ ADMIN USER READY");
    console.log("=".repeat(60));
    console.log(`📧 Email:  ${admin.email}`);
    console.log(`👤 Name:   ${admin.name}`);
    console.log(`🎯 Role:   ${admin.role}`);
    console.log(`✨ Status: ${admin.isActive ? "Active" : "Inactive"}`);
    console.log("\n" + "=".repeat(60));
    console.log("✅ Database seeding complete!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    const prismaError = error as { code?: string };

    if (prismaError?.code === "P2031") {
      console.warn(
        "\n⚠️ Prisma requires a MongoDB replica set for transactions."
      );
      console.warn("   For local development, use: `docker run -d --name mongo -p 27017:27017 mongo`");
      console.error("\n❌ Cannot seed without replica set. Exiting.");
      process.exit(1);
    } else {
      console.error("\n❌ Error creating admin user:");
      console.error(error);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
createAdmin().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
