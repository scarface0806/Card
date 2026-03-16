#!/usr/bin/env node

/**
 * Development server with in-memory MongoDB
 * Runs: MongoDB Memory Server + Prisma seed + Next.js dev server
 */

const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { spawn } = require('child_process');
const path = require('path');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@tapvyo.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function startDevServer() {
  console.log('🚀 Starting Tapvyo NFC Development Server...\n');

  try {
    // Step 1: Start MongoDB Memory Replica Set (required for Prisma transactions)
    console.log('📦 Starting in-memory MongoDB replica set...');
    const mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1 },
    });
    await mongoServer.waitUntilRunning();

    // Ensure the URI includes a database name before any query parameters.
    const rawUri = mongoServer.getUri();
    const [baseUri, queryString] = rawUri.split('?');
    const baseWithDb = baseUri.endsWith('/') ? baseUri + 'tapvyo-nfc' : baseUri + '/tapvyo-nfc';
    const mongoUri = queryString ? `${baseWithDb}?${queryString}` : baseWithDb;
    console.log('✅ MongoDB started on:', mongoUri);

    // Step 2: Set DATABASE_URL environment variable
    process.env.DATABASE_URL = mongoUri;
    process.env.ADMIN_EMAIL = ADMIN_EMAIL;
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    console.log('✅ DATABASE_URL configured\n');

    // Step 3: Run Prisma seed
    console.log('🌱 Seeding database with admin user...');
    const seedProcess = spawn('npm', ['run', 'prisma:seed'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, DATABASE_URL: mongoUri },
      shell: true,
    });

    await new Promise((resolve, reject) => {
      seedProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Database seeded\n');
          resolve();
        } else {
          console.log('⚠️  Seed warning (non-critical)\n');
          resolve(); // Continue anyway
        }
      });
      seedProcess.on('error', reject);
    });

    // Step 4: Start Next.js dev server
    console.log('🔥 Starting Next.js development server...');
    console.log('📱 App will be available at: http://localhost:3000\n');
    console.log('Test login credentials:');
    console.log(`  Email: ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}\n`);

    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, DATABASE_URL: mongoUri },
      shell: true,
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      console.log('\n\n👋 Shutting down...');
      devProcess.kill();
      await mongoServer.stop();
      process.exit(0);
    });

    devProcess.on('close', async () => {
      await mongoServer.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

startDevServer();
