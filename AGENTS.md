# Agent Instructions

Full-stack TeleHealth application. React 19 frontend, .NET 10 minimal-API backend, AWS Lambda functions, Pulumi infrastructure.

## Quick Reference

- **Format code**: `bun x ultracite fix` | `dotnet csharpier format .`
- **Check for issues**: `bun x ultracite check` | `dotnet csharpier check .`
- **Diagnose setup**: `bun x ultracite doctor`

## Build / Test / Lint Commands

### Root (convenience wrappers)

```bash
bun run dev          # Starts frontend + backend in parallel
bun run build        # Builds both
bun run check        # Frontend lint + backend CSharpier check
bun run format       # Frontend fix + backend CSharpier format
bun run test         # Frontend unit tests + backend tests
bun run docker:up    # docker compose up (needs .env)
bun run docker:down  # docker compose down -v
```

### Frontend (Bun + Vite + Vitest)

```bash
cd frontend
bun install          # Install dependencies
bun run dev          # Start dev server (Vite)
bun run build        # tsc -b && vite build
bun run check        # ultracite check (Biome)
bun run fix          # ultracite fix — auto-fixes most issues
bun run test         # vitest --project=unit
bun run test:browser # vitest --project=browser (Playwright/Chromium)
bun run coverage     # vitest run --coverage --project=unit
bun run api:gen      # orval — regenerates API client from OpenAPI
```

**Single test file / pattern:**

```bash
cd frontend
bun run test -- src/components/Button.test.tsx
bun run test -- --test-name-pattern="should render"
```

### Backend (.NET 10)

```bash
cd backend
bun run build        # dotnet build ../TeleHealth.slnx
bun run restore      # dotnet restore ../TeleHealth.slnx --locked-mode
bun run check        # dotnet csharpier check .
bun run format       # dotnet csharpier format .
bun run test         # dotnet test --solution ../TeleHealth.slnx
bun run dev          # dotnet run --project src/TeleHealth.Api/TeleHealth.Api.csproj
```

**Single test class / method:**

```bash
cd backend
dotnet test --filter "FullyQualifiedName~BasicTests"
dotnet test --filter "Name~Add_ReturnsSum"
```

> **CI note:** Backend tests are currently commented out in `.github/workflows/ci-backend.yml`. The test suite exists (Unit/Integration/E2E) but is not enforced in CI right now.

### Pre-commit (Lefthook)

```bash
bun run lefthook     # Install git hooks
```

Hooks run in parallel:

- Frontend check + fix (staged files only)
- Backend CSharpier check
- Root JSON check + fix

## Project Structure

```text
frontend/           # React 19 + TypeScript + Vite + TanStack Router + shadcn/ui
  src/api/          # Generated OpenAPI client (orval)
  src/routes/       # File-based TanStack Router routes
backend/
  src/
    TeleHealth.Api/        # Minimal APIs, Vertical Slice features
    TeleHealth.Contracts/  # Shared DTOs / contracts
  tests/
    TeleHealth.UnitTests/
    TeleHealth.IntegrationTests/
    TeleHealth.E2ETests/
functions/          # AWS Lambda functions (C#)
infra/              # Pulumi infrastructure (C#)
docker/             # Docker Compose for local PostgreSQL + Seq
```

## Key Architecture Notes

- **Backend:** .NET 10 minimal APIs with Vertical Slice Architecture. Each feature lives under `backend/src/TeleHealth.Api/Features/<FeatureName>/` with its own endpoint, handler, and DTOs.
- **API client generation:** Frontend uses [orval](https://orval.dev/) with a custom `ofetch` mutator. OpenAPI spec is served at `http://localhost:5144/openapi/v1.json`. Run `bun run api:gen` in `frontend/` after backend schema changes.
- **Routing:** TanStack Router file-based routing. Route files under `frontend/src/routes/`.
- **Database:** PostgreSQL via EF Core. Migrations run automatically on app startup (`app.MigrateAsync()` in `Program.cs`). No manual `dotnet ef database update` needed.
- **Logging:** Serilog → Console + Seq (structured logs). Local Seq runs in Docker on `http://localhost:8081`.
- **Dev server:** Frontend Vite dev server proxies to `http://localhost:5144`.

## Testing

### Frontend (Vitest)

- Three test projects configured in `vitest.config.ts`: **unit** (happy-dom), **browser** (Playwright/Chromium), **storybook**.
- Unit tests: `src/**/*.{test,spec}.{ts,tsx}`
- Setup file: `frontend/src/test/setup.ts`

### Backend (TUnit)

```csharp
[Test]
public async Task TestName()
{
    await Assert.That(result).IsEqualTo(expected);
}
```

- AwesomeAssertions for assertions, NSubstitute for mocking.
- `[Before(Class)]` / `[After(Class)]` for setup/teardown.
- `[Before(Test)]` / `[After(Test)]` for per-test hooks.

## Code Style

### Frontend

- **Formatter:** Biome via Ultracite. Most issues auto-fixable with `bun run fix`.
- React 19: `ref` is a prop (no `forwardRef`).
- Prefer `for...of` over `.forEach()`.
- Call hooks at top level only, never conditionally.
- Use `const` by default, `let` only when needed, never `var`.

### Backend (C#)

- **Formatter:** CSharpier (enforced in CI).
- File-scoped namespaces, primary constructors where appropriate.
- `Nullable` and `ImplicitUsings` enabled, `TreatWarningsAsErrors` true.
- Naming: PascalCase for types/methods, camelCase for locals, `_camelCase` for private fields, `s_camelCase` for private static.
- Prefer `var` only when type is apparent (disabled by default in `Directory.Build.props`).
- Sort usings: `System` first, separate groups.

## PII & Sensitive Data Handling

This is a healthcare application. Treat the following as PII/PHI that must **never** appear in logs, exception messages, or API responses:

- Email addresses
- IC numbers (also PHI)
- Full names combined with any other identifier
- Phone numbers
- Dates of birth combined with any other identifier
- Passwords or password hashes

**Safe to log:** `PublicId` (GUIDs), `Slug` values, appointment/record IDs.

### Logging Rules

```csharp
// NEVER
Log.Warning("Login failed for user: {Email}", command.Email);

// CORRECT — generic message, no identifier
Log.Warning("Login failed — account not found.");
Log.Warning("Patient not found. PatientId: {PatientId}", patient.PublicId);
```

For auth failures, **both** "user not found" and "wrong password" must log the **same generic message** with no email attached. Distinguishing them in logs is an enumeration risk.

### API Response Rules

Exception `detail` fields surface in ProblemDetails. Never include PII:

```csharp
// NEVER
throw new ConflictException($"Email '{email}' is already registered.");

// CORRECT
throw new DuplicateEmailException(); // detail: "An account with this email already exists."
```

### IC Numbers — Extra Caution

IC numbers are PHI. Do not log them under any circumstances, including duplicate-registration debugging. Trace those events via the audit log only.

## Deployment & Infrastructure

- **Pulumi** provisions AWS infrastructure (RDS, EB, ECR, S3, Lambda, SNS/SQS). See `infra/README.md` for details.
- **GitHub Actions CD:** `cd-deploy.yml` orchestrates infra → frontend → backend → lambda → optional seed.
- **Backend deploy:** Docker image built from repo root (Dockerfile at `backend/src/TeleHealth.Api/Dockerfile`), pushed to ECR, deployed to Elastic Beanstalk.
- **Database seed:** Manual trigger only (`github.event.inputs.seed == 'true'`).

---

Most formatting and common issues are automatically fixed by Biome. Run `bun x ultracite fix` before committing to ensure compliance.
