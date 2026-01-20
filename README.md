# Modern LMS Boilerplate

A production-ready Learning Management System (LMS) boilerplate built with the latest technologies.

## Tech Stack

### Frontend (`apps/web`)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand + TanStack Query
- **UI Components**: Shadcn UI

### Backend (`apps/api`)
- **Framework**: NestJS 10
- **Database**: MySQL 8.0 (via Prisma ORM)
- **Queue**: BullMQ (Redis)
- **API Docs**: Swagger / OpenAPI

### Infrastructure
- **Monorepo File System**: Turborepo + pnpm
- **Containerization**: Docker Compose

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm
- Docker & Docker Compose

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Setup Environment Variables:
   Copy `.env.example` to `.env` in the root.
   ```bash
   cp .env.example .env
   ```

3. Start Infrastructure (DB, Redis, etc.):
   ```bash
   docker-compose up -d
   ```

4. Initialize Database:
   ```bash
   cd apps/api
   pnpm prisma migrate dev --name init
   ```

5. Run Development Server:
   ```bash
   turbo dev
   ```

## Documentation

- **API Documentation**: http://localhost:3001/api/docs
- **Frontend**: http://localhost:3002

## License

MIT
