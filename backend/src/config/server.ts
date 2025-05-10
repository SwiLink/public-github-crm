import fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { config } from "./index";

export const server = fastify({
  logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

// Register plugins
server.register(cors, {
  origin: config.frontendUrl,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["set-cookie"],
  preflight: true,
  preflightContinue: false,
});

server.register(cookie);

server.register(jwt, {
  secret: config.jwtSecret,
  cookie: {
    cookieName: "token",
    signed: false,
  },
});

server.register(swagger, {
  openapi: {
    info: {
      title: "GitHub Repository Manager API",
      version: "1.0.0",
    },
  },
});

server.register(swaggerUi, {
  routePrefix: "/docs",
});

// Health check endpoint
server.get("/health", async () => {
  return { status: "ok" };
});
