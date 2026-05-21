---
description: Coding standards, UI guidelines, and format + lint checks for this project. Always apply before and after writing frontend or backend code.
---

Apply all coding standards and formatting checks for this project whenever writing or reviewing code.

## UI & Design Standards

- **Always use shadcn/ui components** for all UI elements — buttons, inputs, dialogs, cards, badges, tables, etc. Never build custom UI primitives from scratch when a shadcn/ui component exists.
- **Always use Framer Motion** for animations and transitions — page transitions, element enter/exit, hover effects, loading states. Do not use CSS keyframes or other animation libraries for anything Framer Motion can handle.
- Import shadcn/ui components from `@/components/ui/` and Framer Motion from `framer-motion`.

## Formatting Rules

- If **any frontend files** were touched (files under `frontend/`):
  1. Run `cd frontend && bun run format` — Biome auto-formats all files
  2. Run `cd frontend && bun run check` — Ultracite lint + format check; **must pass with zero errors**
  3. If `bun run check` reports errors, fix them and re-run until clean

- If **any backend files** were touched (files under `backend/`):
  1. Run `cd backend && bun run format` — CSharpier auto-formats all C# files
  2. Run `cd backend && bun run check` — CSharpier check; **must pass with zero errors**
  3. If `bun run check` reports errors, run `bun run format` again then re-check

- If **both** were touched, run both sequences above.

## When to run this

- **Before starting to code** on a frontend file — run frontend format + check first so you start from a clean baseline
- **After finishing any file** — run the relevant format command immediately
- **Before every commit** — both format + check must be clean; never commit with lint/format errors

## Feature Structure

When building a new feature, choose the right structure upfront:

- **One file** when: single API call, no pagination/filters/tabs, under ~150 lines total
- **Split hook + component** when: has pagination, filters, tabs, or multiple pieces of state
  - Hook file: `UseXxx.tsx` — logic only, no JSX, returns data + handlers
  - Component file: `XxxComponent.tsx` — JSX only, calls the hook, no API logic

File naming and placement:
- Hook files: `UseXxx.tsx` (capital U — matches project convention)
- Role-specific views: `features/appointments/roles/DoctorXxx.tsx`
- Role dashboard entry points: `features/dashboard/roles/DoctorDashboard.tsx`
- Never put API calls directly in a component — always go through `@/api/generated/`

Per-feature breakdown for Doctor:
- View appointments → hook + component (has pagination/filters)
- View patient info → one file (single fetch, simple display)
- Add consultation notes → one file (form + single mutation)
- Mark appointment complete → inline button action inside appointments component

## Feature Summary (when user says "list down what we did")

When the user asks to list down what was done, always present it in this exact format:

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

## Explaining Code or Architecture

When the user asks "what is X?", "why do we use X?", or "how does X work?" — always answer with this structure:

**What it is** — one plain-English sentence, no jargon.
**Why it's used here** — specific to this project, not generic.
**How it fits in the flow** — where it sits relative to other components.
**Analogy** — one real-world comparison to make it concrete.

Rules:
- Never assume the user knows what an acronym means — define it the first time.
- When explaining architecture, always show how data flows through it: `A → B → C`.
- If something only matters at a specific time (runtime vs. deploy time), say when.
- Keep library/tool explanations separate from cloud infrastructure explanations — they confuse if mixed.
- Always answer "why was this chosen" not just "what it does".

Example of a good architecture explanation format:

> **ALB (Application Load Balancer)**
> What it is: A traffic router that sits in front of your backend server.
> Why used here: It receives all API calls from the internet and forwards them to Beanstalk. It also checks if Beanstalk is healthy.
> How it fits: `Browser → IGW → ALB → Beanstalk EC2`
> Analogy: Like a reception desk — all visitors check in here before being directed to the right room.

> **S3 (Simple Storage Service)**
> What it is: File storage in the cloud. You can store any file — images, PDFs, HTML, JS.
> Why used here: Task #1 uses it to host the built React app files (HTML/JS/CSS). Task #2 uses a separate bucket to store PDF lab reports.
> How it fits: GitHub Actions builds React → uploads files to S3 → users visit S3 URL → browser downloads React app.
> Analogy: Like a USB drive that anyone with the link can download files from.

> **VPC (Virtual Private Cloud)**
> What it is: Your own private, isolated section of AWS's network.
> Why used here: It lets us put Beanstalk and RDS in a private zone where the internet cannot reach them directly. Only the ALB (public-facing) can talk to Beanstalk; only Beanstalk can talk to RDS.
> How it fits: Everything inside the VPC is invisible to the public internet. The IGW and ALB are the only entry points.
> Analogy: Think of AWS as a giant apartment block. Your VPC is your private apartment — strangers can knock at the front door (IGW/ALB) but cannot walk directly into your bedroom (Beanstalk) or safe (RDS).

> **Security Groups**
> What it is: Firewall rules attached to each AWS resource.
> Why used here: RDS only accepts connections from Beanstalk's security group. Beanstalk only accepts connections from the ALB's security group. This means even if someone got into the VPC, they still cannot hit RDS directly.
> How it fits: It enforces the subnet layout — public → private → private is not just physical, it is also enforced by rules.
> Analogy: Like a building's keycard system. The front door (ALB) accepts anyone with an HTTPS request. The server room (Beanstalk) only accepts the front desk keycard. The vault (RDS) only accepts the server room keycard.

> **Elastic Beanstalk**
> What it is: AWS's managed platform for running your application on a cloud computer (EC2 instance).
> Why used here: You upload your C# source code + Dockerfile. Beanstalk handles provisioning the EC2 machine, running `docker build`, starting the container, health monitoring, and rolling deploys. You don't manage the server yourself.
> How it fits: `ALB → Beanstalk EC2 (Docker container running ASP.NET Core) → RDS`
> Analogy: Like renting a fully managed office — you just show up with your work. Someone else handles electricity, internet, cleaning, and security.

> **RDS PostgreSQL**
> What it is: AWS's managed PostgreSQL database running on a dedicated server in a private subnet.
> Why used here: Replaces local/dev databases (like Neon DB) for production. Lives inside the VPC so only Beanstalk can reach it. AWS handles backups, patching, and availability.
> How it fits: `Beanstalk (EF Core) → RDS PostgreSQL` — EF Core translates LINQ queries into SQL, sends to RDS, gets results back.
> Note on Neon DB: Neon is used during development for easy setup. When deploying to AWS, only the database connection string changes — the EF Core code stays identical because both speak PostgreSQL.

> **Bun**
> What it is: A JavaScript runtime and package manager — like Node.js and npm combined into one faster tool.
> Why used here: This project uses Bun instead of Node/npm for both the frontend (running Vite, Biome, building React) and as a task runner for the backend (`bun run dev` calls `dotnet run` with the correct flags).
> Common commands:
> - `bun install` — install all dependencies (like npm install)
> - `bun run dev` — start the development server
> - `bun run build` — compile/bundle code for production
> - `bun run format` — auto-format all files
> - `bun run check` — lint and format check (must pass with zero errors)
> Note: For the backend, `bun run dev` is a wrapper — it calls `dotnet run --project ...` behind the scenes. Never run `dotnet run` bare from `backend/`.

> **Frontend Libraries (Vite, Shadcn, Zod) — NOT in cloud architecture**
> These are code libraries that run inside the browser or during the build step. They do NOT appear in the cloud architecture diagram because they are not AWS services.
> - **Vite**: Build tool. Compiles your React TypeScript code into the HTML/JS/CSS files that get uploaded to S3. After the build, Vite's job is done.
> - **Shadcn/ui**: React component library. Pre-built UI components (buttons, tables, dialogs). Runs in the browser.
> - **Zod**: Form validation library. Validates user input in the browser before sending to the API.
> These only appear in code explanations, not architecture diagrams.

## Important notes

- `bun run check` is strict — Biome/Ultracite will fail on import order, unused vars, code style violations, and formatting drift. Always fix errors before moving on.
- Never skip or bypass these checks with `--no-verify` or similar flags.
- For backend: always run from `backend/` directory (not from `backend/src/TeleHealth.Api/`) so CSharpier covers all C# files in the project.
- Do NOT run `dotnet run` directly from `backend/` — it fails. Use `bun run dev` from `backend/` instead (it passes the correct `--project` flag automatically).
