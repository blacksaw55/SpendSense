import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import cors from "cors";
import express from "express";
import { connectDb } from "./db.js";
import { resolvers } from "./graphql/resolvers.js";
import { typeDefs } from "./graphql/schema.js";

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set: AI parsing will fail until you add it to server/.env");
}

await connectDb();

const apollo = new ApolloServer({ typeDefs, resolvers });
await apollo.start();

const app = express();
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});
// Receipt photos arrive as base64 inside the GraphQL body, so allow a larger payload.
app.use("/graphql", cors({ origin: CLIENT_ORIGIN }), express.json({ limit: "8mb" }), expressMiddleware(apollo));

// Express 5 passes listen errors (e.g. port already in use) to this callback.
app.listen(PORT, (error?: Error) => {
  if (error) {
    console.error(`Could not start on port ${PORT}: ${error.message}`);
    process.exit(1);
  }
  console.log(`SpendSense API ready at http://localhost:${PORT}/graphql`);
});
