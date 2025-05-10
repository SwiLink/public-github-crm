# GitHub Repository Management System

A simple project management (CRM) system for public GitHub repositories that allows users to track and manage their favorite repositories.

## Features

- User authentication and registration
- Repository management
  - Add repositories by GitHub path
  - View repository details
  - Refresh repository data
  - Delete repositories
- Real-time repository statistics
  - Star count
  - Fork count
  - Open issues
  - Creation date

## Tech Stack

### Backend
- TypeScript 5
- Node.js 20 (ESM)
- Fastify
- MongoDB 6
- Mongoose 7 + @typegoose/typegoose
- BullMQ with Redis 7
- JWT Authentication
- Zod for validation
- OpenAPI documentation

### Frontend
- Vite
- React 18
- TypeScript
- React Query
- Tailwind CSS
- shadcn/ui
- Zustand (optional)

### Development Tools
- ESLint
- Prettier
- TypeScript ESLint
- Docker & Docker Compose
- GitHub Actions (CI/CD)

## Prerequisites

- Docker and Docker Compose
- Node.js 20
- Git

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. Start the development environment:
   ```bash
   docker-compose up -d
   ```

3. Install dependencies:
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd frontend
   npm install
   ```

4. Start the development servers:
   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend
   cd frontend
   npm run dev
   ```

5. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/documentation

## Development

### Project Structure

```
.
├── backend/           # Backend application
│   ├── src/
│   │   ├── config/   # Configuration files
│   │   ├── models/   # Database models
│   │   ├── routes/   # API routes
│   │   ├── services/ # Business logic
│   │   └── utils/    # Utility functions
│   └── tests/        # Backend tests
├── frontend/         # Frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   └── tests/        # Frontend tests
└── docker/          # Docker configuration
```

### Available Scripts

#### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run linter

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run linter

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.