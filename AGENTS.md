# TeleHealth Portal — Codex Instructions

This is a full-stack TeleHealth platform with a React frontend, .NET 10 backend, AWS Lambda functions, and Pulumi infrastructure. Always follow these project-wide conventions.

## Area-Specific Instructions

For detailed conventions on specific layers, read the relevant file in [`instructions/`](instructions/) before writing any code in that area:

| File | Covers |
|------|--------|
| [instructions/backend-dotnet.instructions.md](instructions/backend-dotnet.instructions.md) | .NET Minimal API, Vertical Slice, MassTransit, NodaTime, EF Core patterns |
| [instructions/database-ef.instructions.md](instructions/database-ef.instructions.md) | EF Core configuration, migrations, query filters, entity conventions |
| [instructions/frontend-react.instructions.md](instructions/frontend-react.instructions.md) | React, TanStack Router/Query/Form, Zustand, shadcn/ui, Orval usage |
| [instructions/infrastructure-pulumi.instructions.md](instructions/infrastructure-pulumi.instructions.md) | Pulumi C# stacks, AWS resource conventions, S3/SQS/SNS/Lambda |
| [instructions/lambda-functions.instructions.md](instructions/lambda-functions.instructions.md) | AWS Lambda (.NET), SQS event handlers, S3 operations |
| [instructions/testing.instructions.md](instructions/testing.instructions.md) | TUnit patterns, integration test setup, data-driven tests |

## Project Overview

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, TanStack Router/Query/Form, Zustand, shadcn/ui, Tailwind CSS 4, Orval |
| Backend | .NET 10, Minimal APIs, Vertical Slice, EF Core 10, PostgreSQL 18, MassTransit, NodaTime |
| Functions | AWS Lambda (.NET), SQS triggers, S3 operations |
| Infrastructure | Pulumi C# on AWS (S3, SQS, SNS, Lambda) |
| Dev Services | Docker Compose (LocalStack, Seq, PostgreSQL) |

## Architecture Principles

- **Vertical Slice**: Backend features are self-contained slices in `Features/<Domain>/<Operation>/`. Each slice has Command + Validator + Handler + Endpoint.
- **No Repository Pattern**: Handlers use `ApplicationDbContext` directly.
- **Event-Driven**: State changes publish events via MassTransit + EF Core Outbox. Lambda functions consume from SQS.
- **API-First**: OpenAPI spec drives frontend client generation (Orval). Never write manual HTTP calls on the frontend.

## Security Rules (Non-Negotiable)

- JWT tokens stored in **HttpOnly, Secure cookies only** — never in localStorage or sessionStorage
- All API endpoints must have explicit `.RequireAuthorization()` unless explicitly public (login, register)
- Use `AuthConstants.*Policy` for authorization — never use raw role strings
- Validate all inputs: `ValidationFilter<T>` on backend, Zod on frontend
- Sensitive configuration loaded from environment variables / AWS Secrets Manager — never hardcode secrets
- S3 buckets: always block public access and enable server-side encryption
- CORS: only allow the whitelisted frontend origin

## ID Strategy

Every entity has three identifiers:
- `long Id` — internal primary key, **never exposed in API responses or URLs**
- `Guid PublicId` — external identifier used in all API responses
- `string Slug` — URL-friendly identifier for human-readable routes

## Date/Time

- **Always use NodaTime** — never `DateTime`, `DateTimeOffset`, or `DateOnly`
- `Instant` for timestamps, `LocalDate` for date-only, `LocalTime` for time-only
- NodaTime is configured on the JSON serializer, EF Core provider, and OpenAPI schema transformers

## Soft Deletes

- **Never hard delete** records — set `DeletedAt` to the current `Instant`
- EF Core query filters (`HasQueryFilter`) exclude soft-deleted records automatically
- Every entity that supports deletion must have the query filter in its configuration

## Code Quality

- All warnings treated as errors (backend: `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`)
- Backend formatting: **CSharpier** (enforced by lefthook pre-commit hook)
- Frontend formatting/linting: **Biome** (enforced by lefthook pre-commit hook)
- NuGet packages: centrally managed in `Directory.Packages.props` — never add `Version=` to individual `.csproj` files
- .NET version pinned to `10.0.201` in `global.json`

## Build & Format Commands

| Task | Command |
|------|---------|
| Frontend install | `cd frontend && bun install` |
| Frontend dev server | `cd frontend && bun run dev` |
| Frontend build | `cd frontend && bun run build` |
| Frontend lint check | `cd frontend && bun run check` |
| Frontend lint fix | `cd frontend && bun run fix` |
| Frontend tests | `cd frontend && bun run test` |
| Frontend coverage | `cd frontend && bun run coverage` |
| Backend build | `cd backend && bun run build` |
| Backend tests | `cd backend && bun run test` |
| Backend format check | `dotnet csharpier check .` |
| Backend format fix | `dotnet csharpier format .` |
| Global lint fix | `bun x ultracite fix` |
| Global lint check | `bun x ultracite check` |

## Naming Conventions

| Context | Convention |
|---------|-----------|
| C# classes/methods | PascalCase |
| C# private fields | `_camelCase` |
| C# private static fields | `s_camelCase` |
| Database tables/columns | snake_case (auto-converted by EF) |
| TypeScript/TSX | PascalCase components, camelCase variables |
| API routes | kebab-case (`/lab-reports`, `/doctor-schedules`) |
| Slugs | kebab-case |
| Role slugs | kebab-case (`"patient"`, `"lab-tech"`, `"doctor"`) |

## Error Handling

- Backend: throw `ProblemException` subclasses from handlers; `ProblemExceptionHandler` converts them to RFC 9457 Problem Details responses
- Frontend: catch `ApiError` (from `@/api/ofetch-mutator`) in mutation `onError` callbacks; show user-friendly messages via `sonner` toast
- Never swallow exceptions silently

## PII & Sensitive Data Handling

This is a healthcare application. All code must comply with GDPR and health data privacy standards (HIPAA). The following are PII/PHI and must **never** appear in logs, exception messages, or API responses:

**Always PII — never log or expose:** email addresses, IC numbers, full names combined with any other identifier, phone numbers, dates of birth combined with any other identifier, passwords or password hashes.

**Safe to log:** `PublicId` (GUIDs), `Slug` values, internal record/schedule/appointment IDs.

```csharp
// NEVER — logs PII
Log.Warning("Login failed for {Email}", command.Email);

// CORRECT — log intent only, no PII
Log.Warning("Login failed — account not found.");
Log.Warning("Patient not found. PatientId: {PatientId}", patient.PublicId);
```

For auth failures, both "user not found" and "wrong password" must log the same generic message — distinguishing them is an enumeration risk.

Exception `detail` fields surface in ProblemDetails API responses — never include PII there:

```csharp
// NEVER — PII in response
throw new ConflictException($"Email '{email}' is already registered.");

// CORRECT — generic message, log internally
Log.Warning("Duplicate email. Email: {Email}", email);
throw new DuplicateEmailException(); // detail: "An account with this email already exists."
```

IC numbers are PHI — do not log them under any circumstances, even for debugging. Trace IC-related events via the audit log only.

## Testing

- Backend test framework: **TUnit** — never xUnit or NUnit attributes
- All assertions: `await Assert.That(value).IsX()` pattern
- Data-driven: `[Arguments]`, `[MethodDataSource]`, `[MatrixDataSource]`
- DI in tests: `[ClassDataSource<T>]`

## File Locations Quick Reference

| What | Where |
|------|-------|
| API route constants | `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs` |
| Auth policy constants | `backend/src/TeleHealth.Api/Common/Security/AuthConstants.cs` |
| Exception base classes | `backend/src/TeleHealth.Api/Common/Exceptions/` |
| EF context | `backend/src/TeleHealth.Api/Infrastructure/Persistence/ApplicationDbContext.cs` |
| Orval-generated hooks | `frontend/src/api/generated/<tag>/` |
| Auth store | `frontend/src/store/useAuthStore.ts` |
| UI components | `frontend/src/components/ui/` |
| Routes | `frontend/src/routes/` |
| Event contracts | `backend/src/TeleHealth.Contracts/` |

## Format & Lint Checks

After touching any files, run the relevant sequence before committing:

| Layer | Command sequence |
|-------|-----------------|
| Frontend only | `cd frontend && bun run format` → `bun run check` (zero errors required) |
| Backend only | `cd backend && bun run format` → `bun run check` (zero errors required) |
| Both | Run both sequences above |

If `bun run check` reports errors, fix them and re-run until clean. Never skip or bypass with `--no-verify`.

## Feature Summary Format

When asked to list down what was done (e.g. "list down what we did"), always use this exact format:

### Feature: [Feature Name] — [Layer: Backend / Frontend / Both]

**What this feature does**
One or two sentences explaining the purpose in plain language.

**Files Added**
Table with columns: `#`, `Path` (as clickable markdown link), `Purpose` (one line, plain English)

**Files Modified**
Table with columns: `#`, `Path` (as clickable markdown link), `What changed` (one line)

**Commands Run**
Code block with each command, a short comment, and a ✅/❌ result

**API Endpoint Produced** *(backend features only)*
Show the route, all query params with types and defaults, and auth requirement

**Next Steps**
Numbered list of what comes next, in order

Rules:
- All file paths must be clickable markdown links relative to repo root
- Keep each table cell to one line — no paragraphs inside tables
- Plain English only — no jargon the user hasn't seen before
- Always include the commands section even if only format/check was run
