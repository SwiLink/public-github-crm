import { server } from "@/config/server";
import { UserModel } from "@/models/user.model";
import { FastifyRequest, FastifyReply } from "fastify";

export interface JWTPayload {
  id: string;
  _id: string;
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
    const user = await UserModel.findById(request.user.id);
    if (!user) {
      server.log.error("User not found");
      return reply.status(404).send({ error: "User not found" });
    }
    request.user = user;
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized" });
  }
}
