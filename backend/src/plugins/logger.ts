import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    logInfo: (message: string, ...args: unknown[]) => void;
    logError: (message: string, ...args: unknown[]) => void;
  }
}

/**
 * Fastify plugin to add global logging methods.
 * @param fastify Fastify instance
 */
async function loggerPlugin(fastify: FastifyInstance) {
  fastify.decorate("logInfo", (msg: string, ...args: unknown[]) => {
    fastify.log.info(msg, ...args);
  });

  fastify.decorate("logError", (msg: string, ...args: unknown[]) => {
    fastify.log.error(msg, ...args);
  });
}

export default fp(loggerPlugin);
