import dns from "node:dns";
import mongoose from "mongoose";

export async function connectDb(): Promise<void> {
  let uri = process.env.MONGODB_URI;

  // On some Windows machines (e.g. with VPN adapters installed) Node can't read the system
  // DNS settings and falls back to 127.0.0.1, which breaks the SRV lookup that
  // mongodb+srv:// URIs need ("querySrv ECONNREFUSED"). Use public resolvers in that case.
  if (uri?.startsWith("mongodb+srv://") && dns.getServers().every((s) => s.startsWith("127.") || s === "::1")) {
    dns.setServers(["1.1.1.1", "8.8.8.8"]);
  }

  if (!uri) {
    // No database configured: start a throwaway in-memory MongoDB for local dev.
    // Data is lost when the server stops. Set MONGODB_URI to keep it.
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    // First start on Windows can be slow (antivirus scans the new binary), so allow 60s.
    const memoryServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
    uri = memoryServer.getUri();
    console.log("MONGODB_URI not set: using an in-memory database (data resets on restart).");
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });
  } catch (error) {
    console.error(
      "Could not connect to MongoDB. If you use Atlas, check Network Access: your current IP must be allowed.",
    );
    throw error;
  }
  console.log("MongoDB connected");
}
