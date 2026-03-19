import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "santhoshuxui2023@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "KGTPS6565P";
const BCRYPT_ROUNDS = 12; // Match the rounds used in auth endpoints

function resolveMongoDbName(uri) {
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

async function createAdminWithMongoFallback() {
  const uri = process.env.DATABASE_URL?.trim();
  if (!uri) {
    throw new Error("Missing DATABASE_URL for Mongo fallback seed");
  }

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(resolveMongoDbName(uri));
    const users = db.collection("users");

    console.log("🔒 Hashing password (Mongo fallback)...");
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

    // Upsert: update if exists, insert if not
    const escapedEmail = ADMIN_EMAIL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const result = await users.updateOne(
      { email: { $regex: `^${escapedEmail}$`, $options: "i" } },
      {
        $set: {
          name: "Admin",
          email: ADMIN_EMAIL,
          password: hashedPassword,
          role: "ADMIN",
          isActive: true,
          emailVerified: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    if (result.upsertedId) {
      console.log("✅ Admin user created (Mongo fallback)");
    } else if (result.modifiedCount > 0) {
      console.log("✅ Admin user updated (Mongo fallback)");
    } else {
      console.log("✅ Admin user already exists (Mongo fallback)");
    }
  } finally {
    await client.close();
  }
}

async function createAdmin() {
  try {
    console.log("\n🔐 Starting admin user seed...\n");

    // Hash password
    console.log("🔒 Hashing password...");
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

    // Upsert: create or update admin user with correct credentials
    console.log("👤 Upserting admin user...");
    const admin = await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: {
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
        emailVerified: true,
      },
      create: {
        name: "Admin",
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "ADMIN",
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

    console.log("\n" + "=".repeat(60));
    console.log("✅ ADMIN USER READY");
    console.log("=".repeat(60));
    console.log(`\n📧 Email:  ${admin.email}`);
    console.log(`👤 Name:   ${admin.name}`);
    console.log(`🎯 Role:   ${admin.role}`);
    console.log(`✨ Status: ${admin.isActive ? "Active" : "Inactive"}`);
    console.log("\n" + "=".repeat(60));
    console.log("✅ Database seeding complete!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    if (error?.code === "P2031") {
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
