import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "santhoshuxui2023@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "KGTPS6565P";
const BCRYPT_ROUNDS = 12; // Match the rounds used in auth endpoints

async function createAdmin() {
  try {
    console.log("\n🔐 Starting admin user seed...\n");

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Status: ${existingAdmin.isActive ? "Active" : "Inactive"}\n`);
      return;
    }

    // Hash password with bcryptjs
    console.log("🔒 Hashing password...");
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

    // Create admin user
    console.log("👤 Creating admin user...");
    const admin = await prisma.user.create({
      data: {
        name: "Admin",
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
        emailVerified: true, // Admin email is pre-verified
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

    // Log credentials in a prominent way
    console.log("\n" + "=".repeat(60));
    console.log("✅ ADMIN USER CREATED SUCCESSFULLY");
    console.log("=".repeat(60));
    console.log(`\n📧 Email:    ${admin.email}`);
    console.log(`🔐 Password: ${ADMIN_PASSWORD}`);
    console.log(`👤 Name:     ${admin.name}`);
    console.log(`🎯 Role:     ${admin.role}`);
    console.log(`✨ Status:   ${admin.isActive ? "Active" : "Inactive"}`);
    console.log(`📅 Created:  ${admin.createdAt.toLocaleString()}`);
    console.log("\n" + "=".repeat(60));
    console.log("⚠️  IMPORTANT: CHANGE THIS PASSWORD IN PRODUCTION!");
    console.log("⚠️  This seed should only be used for local development.");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Error creating admin user:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
createAdmin().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
