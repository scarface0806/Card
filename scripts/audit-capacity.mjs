#!/usr/bin/env node
/**
 * CAPACITY AUDIT - READ-ONLY.
 *
 * Measures what Tapvyo actually stores, per collection and per Cloudinary
 * folder, so docs/CAPACITY_AUDIT.md can be written from real numbers.
 *
 * READ-ONLY BY CONSTRUCTION
 *  - MongoDB: only dbStats, $collStats, listIndexes, countDocuments and
 *    aggregate pipelines without $out/$merge. Nothing is inserted, updated,
 *    deleted or indexed.
 *  - Cloudinary: only api.usage, api.resources (list). Nothing is uploaded,
 *    renamed or deleted.
 *
 * NO SECRETS, NO PII IN THE OUTPUT
 *  Connection strings and keys are never printed or written. The JSON holds
 *  counts, byte sizes, month buckets, index definitions and Cloudinary folder
 *  totals - no emails, names, phone numbers or URLs.
 *
 * USAGE
 *   node scripts/audit-capacity.mjs                 # reads .env.local
 *   AUDIT_ENV_FILE=.env.audit.local node scripts/audit-capacity.mjs
 *
 * Point AUDIT_ENV_FILE at an UNCOMMITTED file holding the PRODUCTION
 * DATABASE_URL (a read-only Atlas user is ideal) and CLOUDINARY_* values.
 * Writes docs/capacity-audit-data.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { MongoClient } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OUT_FILE = process.env.AUDIT_OUT
  ? path.resolve(process.env.AUDIT_OUT)
  : path.join(ROOT, 'docs', 'capacity-audit-data.json');

// ---------------------------------------------------------------------------
// env - parsed by hand so nothing is echoed and nothing else is loaded
// ---------------------------------------------------------------------------
function loadEnv(file) {
  const full = path.resolve(ROOT, file);
  if (!fs.existsSync(full)) throw new Error(`env file not found: ${file}`);
  const env = {};
  for (const line of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

const envFile = process.env.AUDIT_ENV_FILE || '.env.local';
const env = loadEnv(envFile);

function dbNameFrom(uri) {
  if (env.MONGODB_DB_NAME) return env.MONGODB_DB_NAME;
  try {
    const p = new URL(uri).pathname.replace(/^\//, '');
    if (p) return decodeURIComponent(p);
  } catch { /* fall through */ }
  return 'tapvyo-nfc';
}

function hostKind(uri) {
  if (/mongodb\.net/.test(uri)) return 'atlas';
  if (/127\.0\.0\.1|localhost/.test(uri)) return 'local';
  return 'other';
}

// Collections that grow with business activity, and the date field to bucket by.
const GROWTH = {
  orders: 'createdAt',
  users: 'createdAt',
  customers: 'createdAt',
  cards: 'createdAt',
  leads: 'createdAt',
  card_leads: 'createdAt',
  main_website_leads: 'createdAt',
  contacts: 'createdAt',
  payments_log: 'createdAt',
  email_log: 'createdAt',
  post_views: 'createdAt',
  password_reset_tokens: 'createdAt',
  newsletter_subscribers: 'createdAt',
  galleries: 'createdAt',
};

const MONTHS_BACK = 12;

async function auditMongo() {
  const uri = env.DATABASE_URL;
  if (!uri) return { skipped: 'DATABASE_URL not set in ' + envFile };

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000, readPreference: 'secondaryPreferred' });
  await client.connect();
  try {
    const db = client.db(dbNameFrom(uri));
    const stats = await db.command({ dbStats: 1, scale: 1 });

    const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
      .map((c) => c.name)
      .filter((n) => !n.startsWith('system.'))
      .sort();

    const perCollection = {};
    for (const name of collections) {
      const coll = db.collection(name);
      let storage = {};
      try {
        const [cs] = await coll.aggregate([{ $collStats: { storageStats: {} } }]).toArray();
        const s = cs?.storageStats ?? {};
        storage = {
          count: s.count ?? null,
          avgObjSize: s.avgObjSize ?? null,
          size: s.size ?? null,
          storageSize: s.storageSize ?? null,
          totalIndexSize: s.totalIndexSize ?? null,
        };
      } catch (e) {
        storage = { count: await coll.estimatedDocumentCount(), collStatsError: e.codeName || e.message };
      }

      const indexes = (await coll.listIndexes().toArray()).map((ix) => ({
        name: ix.name,
        key: ix.key,
        ...(ix.expireAfterSeconds !== undefined ? { ttlSeconds: ix.expireAfterSeconds } : {}),
        ...(ix.unique ? { unique: true } : {}),
      }));

      perCollection[name] = { ...storage, indexes, hasTtl: indexes.some((i) => i.ttlSeconds !== undefined) };
    }

    // Monthly growth (read-only aggregate, no $out/$merge).
    const since = new Date();
    since.setUTCMonth(since.getUTCMonth() - MONTHS_BACK, 1);
    since.setUTCHours(0, 0, 0, 0);
    const growth = {};
    for (const [name, field] of Object.entries(GROWTH)) {
      if (!collections.includes(name)) continue;
      const rows = await db.collection(name).aggregate([
        { $match: { [field]: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: `$${field}` } }, n: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).toArray();
      growth[name] = Object.fromEntries(rows.map((r) => [r._id, r.n]));
    }

    // Orders by payment status / custom design, and emails by type/status/month.
    const orders = db.collection('orders');
    const orderBreakdown = collections.includes('orders') ? {
      byPaymentStatus: Object.fromEntries(
        (await orders.aggregate([{ $group: { _id: '$paymentStatus', n: { $sum: 1 } } }]).toArray()).map((r) => [String(r._id), r.n])
      ),
      byStatus: Object.fromEntries(
        (await orders.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]).toArray()).map((r) => [String(r._id), r.n])
      ),
      customDesign: await orders.countDocuments({ customFrontPublicId: { $type: 'string' } }),
      withProfilePhoto: await orders.countDocuments({ profileImagePublicId: { $type: 'string' } }),
      avgProfileDataBytes: (await orders.aggregate([
        { $match: { profileData: { $type: 'object' } } },
        { $group: { _id: null, avg: { $avg: { $bsonSize: '$profileData' } } } },
      ]).toArray())[0]?.avg ?? null,
    } : null;

    const emailByTypeMonth = collections.includes('email_log')
      ? (await db.collection('email_log').aggregate([
          { $match: { createdAt: { $gte: since } } },
          { $group: { _id: { m: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, type: '$type', status: '$status' }, n: { $sum: 1 } } },
          { $sort: { '_id.m': 1 } },
        ]).toArray()).map((r) => ({ month: r._id.m, type: r._id.type, status: r._id.status, n: r.n }))
      : [];

    // rate_limits has expiresAt, not createdAt: report how many are already past it
    // (should be ~0 when the TTL index is working).
    const rateLimits = collections.includes('rate_limits') ? {
      total: await db.collection('rate_limits').countDocuments(),
      pastExpiry: await db.collection('rate_limits').countDocuments({ expiresAt: { $lt: new Date(Date.now() - 2 * 60 * 1000) } }),
      byScope: Object.fromEntries(
        (await db.collection('rate_limits').aggregate([
          { $group: { _id: { $arrayElemAt: [{ $split: ['$_id', ':'] }, 0] }, n: { $sum: 1 } } },
        ]).toArray()).map((r) => [String(r._id), r.n])
      ),
    } : null;

    // Referenced upload ids, for the Cloudinary orphan check (ids only, kept in memory).
    const referenced = new Set();
    if (collections.includes('orders')) {
      const refs = await orders.find(
        { $or: [{ customFrontPublicId: { $type: 'string' } }, { customBackPublicId: { $type: 'string' } }, { profileImagePublicId: { $type: 'string' } }] },
        { projection: { _id: 0, customFrontPublicId: 1, customBackPublicId: 1, profileImagePublicId: 1 } }
      ).toArray();
      for (const r of refs) for (const id of [r.customFrontPublicId, r.customBackPublicId, r.profileImagePublicId]) if (id) referenced.add(id);
    }

    return {
      host: hostKind(uri),
      db: {
        collections: stats.collections,
        objects: stats.objects,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexSize: stats.indexSize,
        totalSize: (stats.storageSize ?? 0) + (stats.indexSize ?? 0),
        fsUsedSize: stats.fsUsedSize ?? null,
        fsTotalSize: stats.fsTotalSize ?? null,
      },
      collections: perCollection,
      growthByMonth: growth,
      orderBreakdown,
      emailByTypeMonth,
      rateLimits,
      _referenced: referenced,
    };
  } finally {
    await client.close();
  }
}

async function auditCloudinary(referenced) {
  const hasUrl = /^cloudinary:\/\//.test(env.CLOUDINARY_URL || '');
  const hasTrio = env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET;
  if (!hasUrl && !hasTrio) return { skipped: 'Cloudinary credentials not set in ' + envFile };

  if (hasTrio) {
    cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
  } else {
    process.env.CLOUDINARY_URL = env.CLOUDINARY_URL;
    cloudinary.config(true);
  }

  const usage = await cloudinary.api.usage();

  // Every image, grouped by top-level folder (first public_id segment).
  const folders = {};
  const all = [];
  let cursor;
  do {
    const page = await cloudinary.api.resources({ type: 'upload', resource_type: 'image', max_results: 500, next_cursor: cursor });
    for (const r of page.resources) {
      const top = r.public_id.includes('/') ? r.public_id.split('/')[0] : '(root)';
      const second = r.public_id.split('/').slice(0, 2).join('/');
      const key = top === 'admin' ? second : top;
      folders[key] ??= { count: 0, bytes: 0 };
      folders[key].count += 1;
      folders[key].bytes += r.bytes || 0;
      all.push({ id: r.public_id, bytes: r.bytes || 0, created: r.created_at });
    }
    cursor = page.next_cursor;
  } while (cursor);

  for (const f of Object.values(folders)) f.avgBytes = f.count ? Math.round(f.bytes / f.count) : 0;

  // Abandoned-upload check: what the cleanup job WOULD delete right now.
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const checkoutUploads = all.filter((r) => r.id.startsWith('custom-cards/') || r.id.startsWith('profile-photos/'));
  const orphans = checkoutUploads.filter((r) => !referenced.has(r.id) && Date.parse(r.created) < weekAgo);
  const referencedBytes = checkoutUploads.filter((r) => referenced.has(r.id));

  return {
    usage: {
      plan: usage.plan,
      last_updated: usage.last_updated,
      credits: usage.credits ?? null,
      storage: usage.storage ?? null,
      bandwidth: usage.bandwidth ?? null,
      transformations: usage.transformations ?? null,
      objects: usage.objects ?? null,
      requests: usage.requests ?? null,
      resources: usage.resources ?? null,
      derived_resources: usage.derived_resources ?? null,
      media_limits: usage.media_limits ?? null,
    },
    folders,
    totalImages: all.length,
    totalBytes: all.reduce((s, r) => s + r.bytes, 0),
    checkoutUploads: {
      count: checkoutUploads.length,
      bytes: checkoutUploads.reduce((s, r) => s + r.bytes, 0),
      referencedCount: referencedBytes.length,
      referencedAvgBytes: referencedBytes.length ? Math.round(referencedBytes.reduce((s, r) => s + r.bytes, 0) / referencedBytes.length) : null,
      orphansOlderThan7Days: orphans.length,
      orphanBytes: orphans.reduce((s, r) => s + r.bytes, 0),
    },
  };
}

function mb(n) { return n == null ? '-' : (n / 1024 / 1024).toFixed(2) + ' MB'; }

const report = { generatedAt: new Date().toISOString(), envFile, mongo: null, cloudinary: null };

try {
  report.mongo = await auditMongo();
} catch (e) {
  report.mongo = { error: e.codeName || e.name || 'error', message: String(e.message).replace(/mongodb(\+srv)?:\/\/\S+/g, '<redacted>') };
}

const referenced = report.mongo?._referenced ?? new Set();
if (report.mongo) delete report.mongo._referenced;

try {
  report.cloudinary = await auditCloudinary(referenced);
} catch (e) {
  report.cloudinary = { error: e.name || 'error', message: String(e.error?.message || e.message) };
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2));

// Console summary (numbers only).
console.log(`env: ${envFile}  db host: ${report.mongo?.host ?? '-'}`);
if (report.mongo?.db) {
  const d = report.mongo.db;
  console.log(`DB: ${d.collections} collections, ${d.objects} docs, data ${mb(d.dataSize)}, storage ${mb(d.storageSize)}, indexes ${mb(d.indexSize)}`);
  for (const [name, c] of Object.entries(report.mongo.collections)) {
    console.log(`  ${name.padEnd(24)} ${String(c.count ?? '-').padStart(7)} docs  avg ${String(c.avgObjSize ?? '-').padStart(6)} B  storage ${mb(c.storageSize)}  idx ${mb(c.totalIndexSize)}${c.hasTtl ? '  TTL' : ''}`);
  }
} else {
  console.log('Mongo:', report.mongo?.skipped || report.mongo?.message);
}
if (report.cloudinary?.usage) {
  console.log(`Cloudinary plan: ${report.cloudinary.usage.plan}; images ${report.cloudinary.totalImages}, ${mb(report.cloudinary.totalBytes)}`);
  for (const [f, v] of Object.entries(report.cloudinary.folders)) console.log(`  ${f.padEnd(24)} ${String(v.count).padStart(6)} imgs  ${mb(v.bytes)}  avg ${mb(v.avgBytes)}`);
} else {
  console.log('Cloudinary:', report.cloudinary?.skipped || report.cloudinary?.message);
}
console.log(`Wrote ${path.relative(ROOT, OUT_FILE)}`);
