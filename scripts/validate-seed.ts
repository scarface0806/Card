#!/usr/bin/env node

/**
 * Seed Validation Script
 * Validates that the admin seed script will work correctly
 * Run this before running `npm run prisma:seed`
 */

import { spawn } from "child_process";
import path from "path";

const checks = [
  {
    name: "bcryptjs installed",
    command: "npm",
    args: ["list", "bcryptjs"],
  },
  {
    name: "@prisma/client installed",
    command: "npm",
    args: ["list", "@prisma/client"],
  },
  {
    name: "Prisma schema valid",
    command: "npx",
    args: ["prisma", "validate"],
  },
];

let passedChecks = 0;
let failedChecks = 0;

function runCheck(check, index) {
  return new Promise((resolve) => {
    console.log(`\n[${index + 1}/${checks.length}] Checking: ${check.name}...`);

    const process = spawn(check.command, check.args, {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    let output = "";
    let errorOutput = "";

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    process.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ ${check.name} - OK`);
        passedChecks++;
      } else {
        console.log(`❌ ${check.name} - FAILED`);
        if (errorOutput) {
          console.error(`   Error: ${errorOutput.substring(0, 100)}...`);
        }
        failedChecks++;
      }
      resolve();
    });
  });
}

async function validateSeeds() {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 ADMIN SEED SCRIPT VALIDATION");
  console.log("=".repeat(60));

  for (let i = 0; i < checks.length; i++) {
    await runCheck(checks[i], i);
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Passed: ${passedChecks}/${checks.length}`);
  if (failedChecks > 0) {
    console.log(`❌ Failed: ${failedChecks}/${checks.length}`);
    console.log("\nPlease fix the above issues before running the seed script.");
    console.log("=".repeat(60) + "\n");
    process.exit(1);
  } else {
    console.log(
      "✨ All checks passed! Ready to run: npm run prisma:seed"
    );
    console.log("=".repeat(60) + "\n");
  }
}

validateSeeds().catch((error) => {
  console.error("Validation error:", error);
  process.exit(1);
});
