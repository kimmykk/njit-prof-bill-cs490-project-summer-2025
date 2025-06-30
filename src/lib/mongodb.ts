// src/lib/mongodb.ts
import { MongoClient, GridFSBucket } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

const options = {
  tls: true,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;

if (process.env.NODE_ENV === "development") {
  if (!globalThis._mongoClientPromise) {
    const mongoClient = new MongoClient(uri, options);
    globalThis._mongoClientPromise = mongoClient.connect();
  }
  client = await globalThis._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  await client.connect();
}

const db = client.db(); // Defaults to the first DB in the connection string
const bucket = new GridFSBucket(db, {
  bucketName: "uploads",
});

export { client, db, bucket };
