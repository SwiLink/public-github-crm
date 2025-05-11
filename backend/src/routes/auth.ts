import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Type } from "@fastify/type-provider-typebox";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/user.model";
import { authenticate } from "../middleware/auth";
import { server } from "@/config/server";

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
      try {
        const { email, password } = request.body as {
          email: string;
          password: string;
        };

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
      } catch (error: any) {
        // User already exists
        if (error?.code === 11000) {
          server.log.error({ error }, "User already exists");
          return reply.code(400).send({ error: "Invalid credentials" });
        }
        server.log.error({ error }, "Registration failed");
        return reply.code(500).send({ error: "Internal error" });
      }
    },
  });

  // Login
  fastify.post("/login", {
    schema: {
      body: loginSchema,
    },
    handler: async (request, reply: FastifyReply) => {
      try {
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
      } catch (error) {
        server.log.error({ error }, "Login failed");
        return reply.code(500).send({ error: "Internal error" });
      }
    },
  });

  // Logout
  fastify.post("/logout", {
    handler: async (_, reply: FastifyReply) => {
      try {
        reply.clearCookie("token");
        return { message: "Logged out successfully" };
      } catch (error) {
        server.log.error({ error }, "Logout failed");
        return reply.code(500).send({ error: "Internal error" });
      }
    },
  });

  // Get current user
  fastify.get("/me", {
    preHandler: authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await UserModel.findById(request.user._id).select(
          "-password"
        );
        if (!user) {
          return reply.status(404).send({ error: "User not found" });
        }
        return user;
      } catch (error) {
        server.log.error({ error }, "Getting personal information failed");
        return reply.code(500).send({ error: "Internal error" });
      }
    },
  });
}
