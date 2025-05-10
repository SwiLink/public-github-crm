import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Type } from "@fastify/type-provider-typebox";
import { RepositoryModel } from "../models/repository.model";
import { UserModel } from "../models/user.model";
import { Octokit } from "@octokit/rest";
import { authenticate, JWTPayload } from "../middleware/auth";
import { server } from "../config/server";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const addRepositorySchema = Type.Object({
  path: Type.String(),
});

// Track ongoing refreshes by userId
const ongoingRefreshes = new Set<string>();

function extractPathFromUrl(url: string): string {
  // Remove https://github.com/ from the URL
  const path = url.replace("https://github.com/", "");
  return path;
}

async function fetchRepositoryData(path: string) {
  const [owner, repo] = path.split("/");
  if (!owner || !repo) {
    throw new Error("Invalid repository path. Expected format: owner/repo");
  }

  try {
    const { data } = await octokit.repos.get({
      owner,
      repo,
    });

    return {
      name: data.name,
      owner: data.owner.login,
      url: data.html_url,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      language: data.language,
      defaultBranch: data.default_branch,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to fetch repository data from GitHub: ${error.message}`
      );
    }
    throw new Error("Failed to fetch repository data from GitHub");
  }
}

async function updateRepositoryData(repositoryId: string, path: string) {
  try {
    const repoData = await fetchRepositoryData(path);
    await RepositoryModel.findByIdAndUpdate(
      repositoryId,
      {
        ...repoData,
        lastRefreshed: new Date(),
      },
      { new: true }
    );
    server.log.info({ repoData }, "Updated repository");
  } catch (error) {
    console.info(error);
    server.log.error({ error }, "Error updating repository");
  }
}

export async function repositoryRoutes(fastify: FastifyInstance) {
  // Get all repositories
  fastify.get("/", {
    preHandler: authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await UserModel.findById((request.user as JWTPayload).id);
      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      // Start background refresh if not already in progress
      if (!ongoingRefreshes.has(user._id.toString())) {
        ongoingRefreshes.add(user._id.toString());

        // Get current repositories without awaiting
        RepositoryModel.find({ userId: user._id })
          .then((repositories) => {
            // Start background refresh for all repositories
            repositories.forEach((repo) => {
              updateRepositoryData(
                repo._id.toString(),
                extractPathFromUrl(repo.url)
              ).catch((error) => {
                console.info(error);
                server.log.error(
                  { error, repoId: repo._id },
                  "Failed to refresh repository"
                );
              });
            });
          })
          .catch((error) => {
            server.log.error(
              { error, userId: user._id },
              "Failed to fetch repositories for refresh"
            );
          })
          .finally(() => {
            ongoingRefreshes.delete(user._id.toString());
          });
      } else {
        server.log.info(
          { userId: user._id },
          "Repository refresh already in progress"
        );
      }

      // Return current repositories immediately
      return RepositoryModel.find({ userId: user._id });
    },
  });

  // Add repository
  fastify.post("/", {
    schema: {
      body: addRepositorySchema,
    },
    preHandler: authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const { path } = request.body as { path: string };
      const user = await UserModel.findById((request.user as JWTPayload).id);
      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      // Check if repository already exists
      const existingRepo = await RepositoryModel.findOne({
        url: path,
        userId: user._id,
      });
      if (existingRepo) {
        return reply.status(400).send({ error: "Repository already exists" });
      }

      try {
        // Create minimal repository record
        const [owner, repo] = path.split("/");
        if (!owner || !repo) {
          return reply.status(400).send({
            error: "Invalid repository path. Expected format: owner/repo",
          });
        }

        const repository = await RepositoryModel.create({
          name: repo,
          owner: owner,
          url: `https://github.com/${path}`,
          userId: user._id,
          // Set default values for required fields
          stars: 0,
          forks: 0,
          openIssues: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          defaultBranch: "main",
        });
        server.log.info({ repository }, "Created initial repository record");

        // Start background update without awaiting
        updateRepositoryData(repository._id.toString(), path).catch((error) => {
          server.log.error({ error }, "Background update failed");
        });

        return repository;
      } catch (error) {
        server.log.error({ error }, "Error creating repository");
        if (error instanceof Error) {
          return reply.status(400).send({ error: error.message });
        }
        return reply
          .status(400)
          .send({ error: "An unexpected error occurred" });
      }
    },
  });

  // Refresh repository
  fastify.post("/:id/refresh", {
    preHandler: authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const user = await UserModel.findById((request.user as JWTPayload).id);
      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      const repository = await RepositoryModel.findOne({
        _id: id,
        userId: user._id,
      });
      if (!repository) {
        return reply.status(404).send({ error: "Repository not found" });
      }

      try {
        // Start background update without awaiting
        await updateRepositoryData(
          repository._id.toString(),
          extractPathFromUrl(repository.url)
        ).catch((error) => {
          server.log.error({ error }, "Background update failed");
        });

        return { message: "Repository refresh started" };
      } catch (error) {
        server.log.error({ error }, "Error starting repository refresh");
        if (error instanceof Error) {
          return reply.status(400).send({ error: error.message });
        }
        return reply
          .status(400)
          .send({ error: "An unexpected error occurred" });
      }
    },
  });

  // Delete repository
  fastify.delete("/:id", {
    preHandler: authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const user = await UserModel.findById((request.user as JWTPayload).id);
      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      const repository = await RepositoryModel.findOne({
        _id: id,
        userId: user._id,
      });
      if (!repository) {
        return reply.status(404).send({ error: "Repository not found" });
      }

      try {
        await RepositoryModel.deleteOne({ _id: id });
        server.log.info({ id, userId: user._id }, "Deleted repository");
        return { message: "Repository deleted" };
      } catch (error) {
        server.log.error({ error }, "Error deleting repository");
        return reply.status(500).send({ error: "Failed to delete repository" });
      }
    },
  });
}
