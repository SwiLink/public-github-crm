import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Type } from "@fastify/type-provider-typebox";
import { RepositoryModel } from "../models/repository.model";
import { Octokit } from "@octokit/rest";
import { authenticate } from "../middleware/auth";
import { server } from "../config/server";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const addRepositorySchema = Type.Object({
  path: Type.String(),
});

// Track ongoing refreshes by userId
const ongoingRefreshes = new Set<string>();

async function fetchRepositoryData(path: string) {
  const [owner, repo] = path.split("/");
  if (!owner || !repo) {
    throw new Error("Invalid repository path. Expected format: owner/repo");
  }

  try {
    const {
      data: {
        name,
        full_name: fullName,
        owner: { login: repoOwner } = {},
        html_url: url,
        description,
        stargazers_count: stars,
        forks_count: forks,
        open_issues_count: openIssues,
        created_at: createdAt,
        updated_at: updatedAt,
        language,
        default_branch: defaultBranch,
      } = {},
    } = await octokit.repos.get({
      owner,
      repo,
    });

    return {
      name,
      fullName,
      owner: repoOwner,
      url,
      description,
      stars,
      forks,
      openIssues,
      createdAt: new Date(createdAt!),
      updatedAt: new Date(updatedAt!),
      language,
      defaultBranch,
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
    server.log.error({ error }, "Error updating repository");
  }
}

export async function repositoryRoutes(fastify: FastifyInstance) {
  // Get all repositories
  fastify.get("/", {
    preHandler: authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Start background refresh if not already in progress
        if (!ongoingRefreshes.has(request.user._id.toString())) {
          ongoingRefreshes.add(request.user._id.toString());

          // Get current repositories without awaiting
          RepositoryModel.find({ userId: request.user._id })
            .then((repositories) => {
              // Start background refresh for all repositories
              repositories.forEach((repo) => {
                updateRepositoryData(repo._id.toString(), repo.fullName).catch(
                  (error) => {
                    server.log.error(
                      { error, repoId: repo._id },
                      "Failed to refresh repository"
                    );
                  }
                );
              });
            })
            .catch((error) => {
              server.log.error(
                { error, userId: request.user._id },
                "Failed to fetch repositories for refresh"
              );
            })
            .finally(() => {
              ongoingRefreshes.delete(request.user._id);
            });
        } else {
          server.log.info(
            { userId: request.user._id },
            "Repository refresh already in progress"
          );
        }

        // Return current repositories immediately
        return RepositoryModel.find({ userId: request.user._id }).lean();
      } catch (error) {
        return reply.status(500).send({ error: "Internal error" });
      }
    },
  });

  // Add repository
  fastify.post("/", {
    schema: {
      body: addRepositorySchema,
    },
    preHandler: authenticate,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { path } = request.body as { path: string };

        // Create minimal repository record
        const [owner, repo] = path.split("/");
        if (!owner || !repo) {
          return reply.status(400).send({
            error: "Invalid repository path. Expected format: owner/repo",
          });
        }

        const repository = await RepositoryModel.create({
          name: repo,
          fullName: path,
          owner: owner,
          url: `https://github.com/${path}`,
          userId: request.user._id,
          // Set default values for required fields
          stars: 0,
          forks: 0,
          openIssues: 0,
          defaultBranch: "main",
        }).catch((error) => {
          if (error.code === 11000) {
            return reply
              .status(400)
              .send({ error: "Repository already exists" });
          }
        });
        server.log.info({ repository }, "Created initial repository record");

        // Start background update without awaiting
        updateRepositoryData(repository?._id.toString(), path).catch(
          (error) => {
            server.log.error({ error }, "Background update failed");
          }
        );

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
      try {
        const { id } = request.params as { id: string };

        const repository = await RepositoryModel.findOne({
          _id: id,
          userId: request.user._id,
        });
        if (!repository) {
          return reply.status(404).send({ error: "Repository not found" });
        }

        await updateRepositoryData(
          repository._id.toString(),
          repository.fullName
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
      try {
        const { id } = request.params as { id: string };

        const { deletedCount } = await RepositoryModel.deleteOne({
          _id: id,
          userId: request.user._id,
        });

        if (deletedCount === 0) {
          return reply.code(404).send({ error: "Repository not found" });
        }

        server.log.info({ id, userId: request.user._id }, "Deleted repository");
        return { message: "Repository deleted" };
      } catch (error) {
        server.log.error({ error }, "Error deleting repository");
        return reply.status(500).send({ error: "Failed to delete repository" });
      }
    },
  });
}
