import mongoose from "mongoose";

export async function connectDb(): Promise<void> {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    // No database configured: start a throwaway in-memory MongoDB for local dev.
    // Data is lost when the server stops. Set MONGODB_URI to keep it.
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    // First start on Windows can be slow (antivirus scans the new binary), so allow 60s.
    const memoryServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
    uri = memoryServer.getUri();
    console.log("MONGODB_URI not set: using an in-memory database (data resets on restart).");
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
