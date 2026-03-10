# 🏥 TeleHealth Portal

A production-grade telehealth system built with React 19, ASP.NET Core, and AWS.
CT071-3-3-DDAC Group Project — Asia Pacific University of Technology and Innovation

## Tech Stack

- **Frontend:** React 19 + Vite + TanStack Router + shadcn/ui + Tailwind CSS
- **Backend:** ASP.NET Core Minimal APIs (.NET 9) — Vertical Slice Architecture
- **Database:** Amazon RDS for PostgreSQL (EF Core)
- **Cloud:** AWS EC2/Beanstalk, Lambda, S3, SNS, SQS, EventBridge
- **IaC:** Pulumi (C#)
- **CI/CD:** GitHub Actions

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.x
- [.NET SDK](https://dotnet.microsoft.com) >= 9.0
- [Docker + Docker Compose](https://docker.com)
- [Pulumi CLI](https://pulumi.com)

### Local Development

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Start backing services (PostgreSQL + LocalStack)
docker compose up -d

# 3. Run database migrations
cd apps/api/src/TeleHealth.Api
dotnet ef database update

# 4. Start the API
dotnet run

# 5. Start the frontend (new terminal)
cd apps/web
bun install
bun dev
```

## Project Structure

See `docs/architecture/` for diagrams.
