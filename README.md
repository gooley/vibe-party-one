# Vibe Party One

A comprehensive TypeScript project baseline with Next.js, pnpm workspaces, and modern development tooling.

## 🚀 Features

- **Next.js 15** with TypeScript for modern web development
- **pnpm workspaces** for efficient monorepo management
- **BullMQ + Redis** for background job processing
- **Docker Compose** for development and production environments
- **ESLint + Prettier** with 2025 flat config for code quality
- **Vitest** for lightweight testing
- **Semantic Release** with Conventional Commits for automated versioning
- **GitHub Codespaces** ready development environment

## 📦 Project Structure

```
├── apps/
│   ├── web/          # Next.js frontend application
│   └── worker/       # Background job worker
├── packages/
│   └── shared/       # Shared types and utilities
├── .devcontainer/    # GitHub Codespaces configuration
├── .github/          # GitHub Actions workflows
└── docker-compose.yml # Docker services configuration
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+ (Active LTS)
- pnpm 10+
- Docker and Docker Compose (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gooley/vibe-party-one.git
   cd vibe-party-one
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Start development services**
   ```bash
   # Start all services in parallel
   pnpm dev
   
   # Or start with Docker Compose
   docker-compose -f docker-compose.dev.yml up
   ```

### Development Commands

```bash
# Development
pnpm dev              # Start all services in development mode
pnpm build            # Build all packages
pnpm clean            # Clean build artifacts

# Quality Gates
pnpm lint             # Run ESLint across all packages
pnpm type-check       # Run TypeScript type checking
pnpm test:run         # Run tests
pnpm format           # Format code with Prettier
pnpm format:check     # Check code formatting

# Individual services
pnpm --filter web dev      # Start only web app
pnpm --filter worker dev   # Start only worker
pnpm --filter shared build # Build only shared package
```

## 🏗️ Architecture

### Web Application (Next.js)
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **API Routes**: RESTful endpoints for job management
- **Port**: 3000

### Worker Application
- **Runtime**: Node.js with TypeScript
- **Queue**: BullMQ for job processing
- **Database**: Redis for job storage
- **Port**: N/A (background service)

### Shared Package
- **Purpose**: Common types, utilities, and business logic
- **Exports**: Job types, validation functions, utilities

## 🔧 Configuration

### Environment Variables

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Next.js Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Worker Configuration
WORKER_CONCURRENCY=1
```

### Docker Services

The project includes Docker configurations for:
- **Redis**: Job queue storage
- **Web**: Next.js application
- **Worker**: Background job processor

## 🧪 Testing

Testing is set up with Vitest for the shared package:

```bash
# Run all tests
pnpm test:run

# Run tests in watch mode
pnpm test

# Run tests for specific package
pnpm --filter shared test
```

## 🚀 Deployment

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
docker-compose up -d
```

### Single VM Deployment
The project is designed for deployment on a single VM with:
- Docker Compose for service orchestration
- Redis for job queue persistence
- Environment-based configuration

## 📋 API Endpoints

### Job Management
- `POST /api/jobs` - Queue a new job
- `GET /api/jobs` - Get job statistics and status

Example job queuing:
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"type": "example-job", "data": {"message": "Hello World"}}'
```

## 🔄 CI/CD

The project uses GitHub Actions for:
- **Linting**: ESLint and Prettier checks
- **Type Checking**: TypeScript validation
- **Testing**: Vitest test execution
- **Building**: Full project build verification
- **Releasing**: Semantic release based on conventional commits

### Commit Convention

This project follows [Conventional Commits](https://conventionalcommits.org/):

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit changes using conventional commits
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern TypeScript and Next.js
- Inspired by best practices in monorepo management
- Designed for developer experience and productivity