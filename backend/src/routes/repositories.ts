import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type } from '@fastify/type-provider-typebox';
import { RepositoryModel } from '../models/repository.model';
import { UserModel } from '../models/user.model';
import { Octokit } from '@octokit/rest';
import { authenticate, JWTPayload } from '../middleware/auth';

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

const addRepositorySchema = Type.Object({
    path: Type.String(),
});

function extractPathFromUrl(url: string): string {
    // Remove https://github.com/ from the URL
    const path = url.replace('https://github.com/', '');
    return path;
}

async function fetchRepositoryData(path: string) {
    const [owner, repo] = path.split('/');
    if (!owner || !repo) {
        throw new Error('Invalid repository path. Expected format: owner/repo');
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
            throw new Error(`Failed to fetch repository data from GitHub: ${error.message}`);
        }
        throw new Error('Failed to fetch repository data from GitHub');
    }
}

async function updateRepositoryData(repositoryId: string, path: string) {
    try {
        const repoData = await fetchRepositoryData(path);
        const updatedRepo = await RepositoryModel.findByIdAndUpdate(
            repositoryId,
            {
                ...repoData,
                lastRefreshed: new Date(),
            },
            { new: true }
        );
        console.log('Updated repository:', updatedRepo);
    } catch (error) {
        console.error('Error updating repository:', error);
    }
}

export async function repositoryRoutes(fastify: FastifyInstance) {
    // Get all repositories
    fastify.get('/', {
        preHandler: authenticate,
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            const user = await UserModel.findById((request.user as JWTPayload).id);
            if (!user) {
                return reply.status(404).send({ error: 'User not found' });
            }
            const repositories = await RepositoryModel.find({ userId: user._id });
            return repositories;
        },
    });

    // Add repository
    fastify.post('/', {
        schema: {
            body: addRepositorySchema,
        },
        preHandler: authenticate,
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            const { path } = request.body as { path: string };
            const user = await UserModel.findById((request.user as JWTPayload).id);
            if (!user) {
                return reply.status(404).send({ error: 'User not found' });
            }

            // Check if repository already exists
            const existingRepo = await RepositoryModel.findOne({ url: path, userId: user._id });
            if (existingRepo) {
                return reply.status(400).send({ error: 'Repository already exists' });
            }

            try {
                // Create minimal repository record
                const [owner, repo] = path.split('/');
                if (!owner || !repo) {
                    return reply.status(400).send({ error: 'Invalid repository path. Expected format: owner/repo' });
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
                    defaultBranch: 'main',
                });
                fastify.log.info('Created initial repository record:', repository);

                // Start background update without awaiting
                updateRepositoryData(repository._id.toString(), path).catch(error => {
                    fastify.log.error('Background update failed:', error);
                });

                return repository;
            } catch (error) {
                fastify.log.error('Error creating repository:', error);
                if (error instanceof Error) {
                    return reply.status(400).send({ error: error.message });
                }
                return reply.status(400).send({ error: 'An unexpected error occurred' });
            }
        },
    });

    // Refresh repository
    fastify.post('/:id/refresh', {
        preHandler: authenticate,
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            const { id } = request.params as { id: string };
            const user = await UserModel.findById((request.user as JWTPayload).id);
            if (!user) {
                return reply.status(404).send({ error: 'User not found' });
            }

            const repository = await RepositoryModel.findOne({ _id: id, userId: user._id });
            if (!repository) {
                return reply.status(404).send({ error: 'Repository not found' });
            }

            try {
                // Start background update without awaiting
                updateRepositoryData(repository._id.toString(), extractPathFromUrl(repository.url)).catch(error => {
                    fastify.log.error('Background update failed:', error);
                });

                return { message: 'Repository refresh started' };
            } catch (error) {
                fastify.log.error('Error starting repository refresh:', error);
                if (error instanceof Error) {
                    return reply.status(400).send({ error: error.message });
                }
                return reply.status(400).send({ error: 'An unexpected error occurred' });
            }
        },
    });

    // Delete repository
    fastify.delete('/:id', {
        preHandler: authenticate,
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            const { id } = request.params as { id: string };
            const user = await UserModel.findById((request.user as JWTPayload).id);
            if (!user) {
                return reply.status(404).send({ error: 'User not found' });
            }

            const repository = await RepositoryModel.findOne({ _id: id, userId: user._id });
            if (!repository) {
                return reply.status(404).send({ error: 'Repository not found' });
            }

            try {
                await RepositoryModel.deleteOne({ _id: id });
                fastify.log.info('Deleted repository:', { id, userId: user._id });
                return { message: 'Repository deleted' };
            } catch (error) {
                fastify.log.error('Error deleting repository:', error);
                return reply.status(500).send({ error: 'Failed to delete repository' });
            }
        },
    });
} 