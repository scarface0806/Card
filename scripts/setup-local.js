#!/usr/bin/env node

/**
 * Local Development Setup Script
 * Quickly sets up admin user and starts development server
 * 
 * Usage: npm run setup:local
 */

const { spawn } = require("child_process");
const path = require("path");

function run(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}`));
      } else {
        resolve();
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

async function setupLocal() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 TAPVYO NFC - LOCAL DEVELOPMENT SETUP");
  console.log("=".repeat(70) + "\n");

  try {
    // Step 1: Check environment
    console.log("📋 Step 1/4: Checking environment...\n");
    console.log(
      "✓ Node.js version: " + process.version
    );
    console.log("✓ Working directory: " + process.cwd());
    console.log();

    // Step 2: Create admin user
    console.log("📋 Step 2/4: Creating admin user...\n");
    await run("npm", ["run", "prisma:seed"]);
    console.log();

    // Step 3: Build project
    console.log("📋 Step 3/4: Verifying production build...\n");
    await run("npm", ["run", "build"]);
    console.log();

    // Step 4: Summary
    console.log("=".repeat(70));
    console.log("✅ SETUP COMPLETE - Ready for Development!");
    console.log("=".repeat(70) + "\n");

    console.log("📊 ADMIN CREDENTIALS:\n");
    console.log("   Email:    admin@tapvyo.com");
    console.log("   Password: admin123");
    console.log("   Role:     ADMIN\n");

    console.log("🚀 To start development server:\n");
    console.log("   npm run dev\n");

    console.log("🌐 Then access:\n");
    console.log("   Dashboard: http://localhost:3000/admin");
    console.log("   Login:     http://localhost:3000/login");
    console.log("   Home:      http://localhost:3000\n");

    console.log("📝 Documentation:\n");
    console.log("   Admin Setup:     ./ADMIN_SETUP.md");
    console.log("   Local Login:     ./LOCAL_ADMIN_LOGIN.md");
    console.log("=".repeat(70) + "\n");
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    console.log("\n" + "=".repeat(70));
    console.log("Troubleshooting:");
    console.log("1. Ensure MongoDB is running locally");
    console.log("2. Check .env.local has DATABASE_URL");
    console.log("3. Run: npm install");
    console.log("4. Run: npm run build");
    console.log("5. Try again: npm run setup:local");
    console.log("=".repeat(70) + "\n");
    process.exit(1);
  }
}

setupLocal();
