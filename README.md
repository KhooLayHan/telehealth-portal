# 🏥 TeleHealth Portal

A production-grade telehealth system built with React 19, ASP.NET Core (.NET 10), and AWS.

CT071-3-3-DDAC Group Project — Asia Pacific University of Technology and Innovation

## Tech Stack

- **Frontend:** React 19 + Vite + TanStack Router + shadcn/ui + Tailwind CSS
- **Backend:** ASP.NET Core Minimal APIs (.NET 10) — Vertical Slice Architecture
- **Database:** PostgreSQL via EF Core (local Docker / AWS RDS)
- **Cloud:** AWS Elastic Beanstalk, Lambda, S3, SNS, SQS, EventBridge
- **IaC:** Pulumi (C#)
- **CI/CD:** GitHub Actions

## Prerequisites

- [Bun](https://bun.sh) >= 1.x
- [.NET SDK](https://dotnet.microsoft.com) >= 10.0
- [Docker + Docker Compose](https://docker.com)
- [Pulumi CLI](https://pulumi.com) (for infrastructure deployments)

## Local Development

### 1. Start backing services

```bash
cp .env.example .env
# Edit .env with your local secrets

bun run docker:up    # PostgreSQL + Seq (structured log viewer)
```

### 2. Start the backend

```bash
cd backend
bun run dev          # Runs on http://localhost:5144
# Migrations apply automatically on startup
```

### 3. Start the frontend

```bash
cd frontend
bun install
bun run dev          # Vite dev server on http://localhost:5173
# Proxies API calls to localhost:5144
```

### 4. Regenerate API client (after backend schema changes)

```bash
cd frontend
bun run api:gen      # Reads http://localhost:5144/openapi/v1.json via orval
```

## Useful Commands

| Task | Command |
|------|---------|
| Run all checks | `bun run check` |
| Fix formatting / lint | `bun run format` |
| Run all tests | `bun run test` |
| Stop Docker services | `bun run docker:down` |
| View structured logs | Open http://localhost:8081 (Seq) |

See [`AGENTS.md`](./AGENTS.md) for the full developer command reference, testing details, code-style rules, and PII/PHI handling guidelines.

## Project Structure

```
frontend/           # React 19 + TypeScript + Vite + Vitest
  src/api/          # Auto-generated OpenAPI client (orval)
  src/routes/       # TanStack Router file-based routes
backend/            # .NET 10 minimal API + tests
  src/
    TeleHealth.Api/        # Vertical Slice features, endpoints, EF Core
    TeleHealth.Contracts/  # Shared DTOs / contracts
  tests/
    TeleHealth.UnitTests/
    TeleHealth.IntegrationTests/
    TeleHealth.E2ETests/
functions/          # AWS Lambda functions (C#)
infra/              # Pulumi infrastructure definitions (C#)
docker/             # Docker Compose for local PostgreSQL + Seq
```

## Documentation

- [`AGENTS.md`](./AGENTS.md) — Developer reference: commands, conventions, PII rules
- `infra/README.md` — Pulumi infrastructure details
- `docs/DATABASE_SCHEMA.md` — Database schema documentation

## License

This project is for academic purposes (CT071-3-3-DDAC).
