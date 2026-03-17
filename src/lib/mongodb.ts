import { MongoClient, type Db } from "mongodb";

const uri = process.env.DATABASE_URL;

if (!uri || !uri.trim()) {
  throw new Error("Missing environment variable");
}

const options = {};

type MongoGlobal = {
  mongoClientPromise?: Promise<MongoClient>;
};

const globalForMongo = globalThis as unknown as MongoGlobal;

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!globalForMongo.mongoClientPromise) {
    const client = new MongoClient(uri, options);
    globalForMongo.mongoClientPromise = client.connect();
  }
  clientPromise = globalForMongo.mongoClientPromise;
} else {
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getMongoDb(dbName?: string): Promise<Db> {
  const client = await clientPromise;
  return dbName ? client.db(dbName) : client.db();
}

export async function pingMongo(): Promise<boolean> {
  const db = await getMongoDb();
  await db.command({ ping: 1 });
  return true;
}

export default clientPromise;
