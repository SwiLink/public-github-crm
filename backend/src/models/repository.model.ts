import mongoose, { Schema, Document } from "mongoose";

export interface IRepository extends Document {
  name: string;
  owner: string;
  url: string;
  description?: string;
  stars: number;
  forks: number;
  openIssues: number;
  createdAt: Date;
  updatedAt: Date;
  language?: string;
  defaultBranch: string;
  userId: mongoose.Types.ObjectId;
  lastRefreshed?: Date;
}

const repositorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    stars: {
      type: Number,
      required: true,
      default: 0,
    },
    forks: {
      type: Number,
      required: true,
      default: 0,
    },
    openIssues: {
      type: Number,
      required: true,
      default: 0,
    },
    createdAt: {
      type: Date,
      required: true,
    },
    updatedAt: {
      type: Date,
      required: true,
    },
    language: {
      type: String,
    },
    defaultBranch: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastRefreshed: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      getters: true,
    },
  }
);

export const RepositoryModel = mongoose.model<IRepository>(
  "Repository",
  repositorySchema
);
