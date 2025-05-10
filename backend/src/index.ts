import { config } from "./config";
import { server } from "./config/server";
import { authRoutes } from "./routes/auth";
import { repositoryRoutes } from "./routes/repositories";
import { connectToDatabase } from "./config/database";

async function start() {
  try {
    await connectToDatabase();
    server.log.info("Connected to MongoDB");

    // Register routes
    server.register(authRoutes, { prefix: "/api/auth" });
    server.register(repositoryRoutes, { prefix: "/api/repositories" });

    // Start server
    await server.listen({ port: config.port, host: "0.0.0.0" });
    server.log.info({ port: config.port }, "Server is running");
  } catch (err) {
    server.log.error({ error: err }, "Failed to start server");
    process.exit(1);
  }
}

start();
