#!/bin/bash

# Add environment variables
cat > .env << EOL
# FRONTEND
VITE_API_URL=http://localhost:3000/api

# BACKEND
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://mongodb:27017/github-crm
REDIS_URI=redis://redis:6379
JWT_SECRET=your-secret-key-change-in-production
GITHUB_API_TOKEN=your-github-token
EOL

# Start the development environment
docker compose up -d 