import { FastifyRequest, FastifyReply } from "fastify";

export interface JWTPayload {
  id: string;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: JWTPayload;
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized" });
  }
}
