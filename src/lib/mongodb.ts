import { MongoClient, type Db } from "mongodb";

const options = {};

type MongoGlobal = {
  mongoClientPromise?: Promise<MongoClient>;
};

const globalForMongo = globalThis as unknown as MongoGlobal;

let clientPromise: Promise<MongoClient> | null = null;

function getMongoClientPromise(): Promise<MongoClient> {
  const uri = process.env.DATABASE_URL;

  if (!uri || !uri.trim()) {
    throw new Error("Missing environment variable DATABASE_URL");
  }

  if (!globalForMongo.mongoClientPromise) {
    const client = new MongoClient(uri, options);
    globalForMongo.mongoClientPromise = client.connect();
  }

  return globalForMongo.mongoClientPromise;
}

function ensureClientPromise(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = getMongoClientPromise();
  }
  return clientPromise;
}

export async function getMongoDb(dbName?: string): Promise<Db> {
  const client = await ensureClientPromise();
  return dbName ? client.db(dbName) : client.db();
}

export async function pingMongo(): Promise<boolean> {
  const db = await getMongoDb();
  await db.command({ ping: 1 });
  return true;
}

export default ensureClientPromise;
