# GitHub Repository Manager

A modern web application for tracking and managing GitHub repositories. Built with React, TypeScript, and Fastify.

## Features

- 🔍 Track multiple GitHub repositories
- 📊 Monitor repository statistics (stars, forks, issues)
- 🔄 Real-time updates with automatic refresh
- 🔐 Secure authentication
- 🎨 Modern, responsive UI
- ⚡ Fast and efficient performance

## Tech Stack

### Frontend
- React 18
- TypeScript
- TanStack Query (React Query)
- Tailwind CSS
- shadcn/ui Components
- Vite

### Backend
- Node.js
- Fastify
- TypeScript
- MongoDB
- JWT Authentication
- Bull Queue (for background tasks)

## Prerequisites

- Node.js 18+
- MongoDB 6+
- Docker and Docker Compose (optional)

## Getting Started

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Start the development environment:
```bash
./init.sh
```

3. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/documentation

### Manual Setup

#### Backend Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the development server:
```bash
npm run dev
```

#### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the development server:
```bash
npm run dev
```

## Development

### Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/     # Configuration files
│   │   ├── middleware/ # Request middleware
│   │   ├── models/     # Database models
│   │   ├── plugins/    # Fastify plugins
│   │   ├── routes/     # API routes
│   │   └── services/   # Business logic
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utility functions
│   │   ├── pages/      # Page components
│   │   └── styles/     # Global styles
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yaml
└── init.sh
```

### Available Scripts

#### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linter

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run linter

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Repositories
- `GET /repositories` - List all repositories
- `POST /repositories` - Add a new repository
- `GET /repositories/{id}` - Get repository details
- `DELETE /repositories/{id}` - Delete a repository
- `POST /repositories/{id}/refresh` - Refresh repository data

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Fastify](https://www.fastify.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)