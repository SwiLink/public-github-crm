import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Type } from "@fastify/type-provider-typebox";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/user.model";
import { authenticate, JWTPayload } from "../middleware/auth";

const registerSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 6 }),
});

const loginSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post("/register", {
    schema: {
      body: registerSchema,
    },
    handler: async (request, reply: FastifyReply) => {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };

      // Check if user exists
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        return reply.status(400).send({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await UserModel.create({
        email,
        password: hashedPassword,
      });

      // Generate token
      const token = fastify.jwt.sign({ id: user._id.toString() });

      // Set cookie
      reply.setCookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      return { message: "User registered successfully" };
    },
  });

  // Login
  fastify.post("/login", {
    schema: {
      body: loginSchema,
    },
    handler: async (request, reply: FastifyReply) => {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };

      // Find user
      const user = await UserModel.findOne({ email });
      if (!user) {
        return reply.status(401).send({ error: "Invalid credentials" });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return reply.status(401).send({ error: "Invalid credentials" });
      }

      // Generate token
      const token = fastify.jwt.sign({ id: user._id.toString() });

      // Set cookie
      reply.setCookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      return { message: "Logged in successfully" };
    },
  });

  // Logout
  fastify.post("/logout", {
    handler: async (request, reply: FastifyReply) => {
      reply.clearCookie("token");
      return { message: "Logged out successfully" };
    },
  });

  // Get current user
  fastify.get("/me", {
    preHandler: authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await UserModel.findById(
        (request.user as JWTPayload).id
      ).select("-password");
      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }
      return user;
    },
  });
}
