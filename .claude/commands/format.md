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

## Important notes

- `bun run check` is strict — Biome/Ultracite will fail on import order, unused vars, code style violations, and formatting drift. Always fix errors before moving on.
- Never skip or bypass these checks with `--no-verify` or similar flags.
- For backend: always run from `backend/` directory (not from `backend/src/TeleHealth.Api/`) so CSharpier covers all C# files in the project.
- Do NOT run `dotnet run` directly from `backend/` — it fails. Use `bun run dev` from `backend/` instead (it passes the correct `--project` flag automatically).
