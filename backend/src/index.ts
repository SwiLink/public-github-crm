import fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config';
import { connectToDatabase } from './config/database';
import { authRoutes } from './routes/auth';
import { repositoryRoutes } from './routes/repositories';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

const server = fastify({
    logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

// Register plugins
server.register(cors, {
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie'],
    preflight: true,
    preflightContinue: false,
});

server.register(cookie);

server.register(jwt, {
    secret: config.jwtSecret,
    cookie: {
        cookieName: 'token',
        signed: false,
    },
});

server.register(swagger, {
    openapi: {
        info: {
            title: 'GitHub Repository Manager API',
            version: '1.0.0',
        },
    },
});

server.register(swaggerUi, {
    routePrefix: '/docs',
});

// Register routes
server.register(authRoutes, { prefix: '/api/auth' });
server.register(repositoryRoutes, { prefix: '/api/repositories' });

// Health check endpoint
server.get('/health', async () => {
    return { status: 'ok' };
});

// Start server
const start = async () => {
    try {
        await connectToDatabase();
        await server.listen({ port: config.port, host: '0.0.0.0' });
        console.log(`Server listening on port ${config.port}`);
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
};

start(); 