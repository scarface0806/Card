import { PrismaClient } from "@prisma/client";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "santhoshuxui2023@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "KGTPS6565P";
const BCRYPT_ROUNDS = 12; // Match the rounds used in auth endpoints

function resolveMongoDbName(uri: string): string {
  const explicit = process.env.MONGODB_DB_NAME?.trim();
  if (explicit) return explicit;

  try {
    const fromUri = new URL(uri).pathname.replace(/^\//, "").trim();
    if (fromUri) return decodeURIComponent(fromUri);
  } catch {
    // Ignore parse errors; default will be used.
  }

  return "tapvyo-nfc";
}

async function createAdminWithMongoFallback(): Promise<void> {
  const uri = process.env.DATABASE_URL?.trim();
  if (!uri) {
    throw new Error("Missing DATABASE_URL for Mongo fallback seed");
  }

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(resolveMongoDbName(uri));
    const users = db.collection("users");
    const escapedEmail = ADMIN_EMAIL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const existingAdmin = await users.findOne({
      email: { $regex: `^${escapedEmail}$`, $options: "i" },
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists (Mongo fallback)");
      return;
    }

    console.log("🔒 Hashing password (Mongo fallback)...");
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

    await users.insertOne({
      name: "Admin",
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ Admin user created successfully (Mongo fallback)");
    console.log(`📧 Email:    ${ADMIN_EMAIL}`);
    console.log(`🔐 Password: ${ADMIN_PASSWORD}`);
  } finally {
    await client.close();
  }
}

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
        role: Role.ADMIN,
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
    const prismaError = error as { code?: string };

    if (prismaError?.code === "P2031") {
      console.warn("\n⚠️ Prisma seed needs a replica set. Falling back to direct MongoDB seeding...");

      try {
        await createAdminWithMongoFallback();
      } catch (fallbackError) {
        console.error("\n❌ Mongo fallback seed failed:");
        console.error(fallbackError);
        process.exit(1);
      }
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
