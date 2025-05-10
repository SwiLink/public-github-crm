import mongoose from "mongoose";
import { config } from "./index";
import { server } from "./server";

export async function connectToDatabase() {
  try {
    await mongoose.connect(config.mongodbUri);
    server.log.info({ message: "Connected to MongoDB" });
  } catch (error) {
    server.log.error({ error }, "MongoDB connection error");
    process.exit(1);
  }
}
