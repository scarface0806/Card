import { MongoClient, type Db } from "mongodb";

const options = {};

type MongoGlobal = {
  mongoClientPromise?: Promise<MongoClient>;
  mongoConnectionLogged?: boolean;
};

const globalForMongo = globalThis as unknown as MongoGlobal;

let clientPromise: Promise<MongoClient> | null = null;

function getMongoDbName(): string {
  const explicitName = process.env.MONGODB_DB_NAME?.trim();
  if (explicitName) {
    return explicitName;
  }

  const uri = getDatabaseUrlOrThrow();

  try {
    const parsed = new URL(uri);
    const pathName = parsed.pathname.replace(/^\//, "").trim();

    if (pathName) {
      return decodeURIComponent(pathName);
    }
  } catch {
    // Ignore parse errors here; MongoClient will surface the real URI issue.
  }

  return "tapvyo-nfc";
}

function getDatabaseUrlOrThrow(): string {
  const uri = process.env.DATABASE_URL?.trim();

  if (!uri) {
    throw new Error("Missing environment variable DATABASE_URL");
  }

  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    throw new Error("DATABASE_URL must be a valid MongoDB connection string");
  }

  return uri;
}

function getMongoClientPromise(): Promise<MongoClient> {
  const uri = getDatabaseUrlOrThrow();

  if (!globalForMongo.mongoClientPromise) {
    const client = new MongoClient(uri, options);
    globalForMongo.mongoClientPromise = client.connect()
      .then((connectedClient) => {
        if (!globalForMongo.mongoConnectionLogged) {
          console.info("[MongoDB] Connected successfully");
          globalForMongo.mongoConnectionLogged = true;
        }

        return connectedClient;
      })
      .catch((error) => {
        globalForMongo.mongoClientPromise = undefined;
        console.error("[MongoDB] Connection failed:", error);
        throw error;
      });
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
  return client.db(dbName || getMongoDbName());
}

export async function pingMongo(): Promise<boolean> {
  const db = await getMongoDb();
  await db.command({ ping: 1 });
  return true;
}

export default ensureClientPromise;
