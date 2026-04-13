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

## Important notes

- `bun run check` is strict — Biome/Ultracite will fail on import order, unused vars, code style violations, and formatting drift. Always fix errors before moving on.
- Never skip or bypass these checks with `--no-verify` or similar flags.
- For backend: always run from `backend/` directory (not from `backend/src/TeleHealth.Api/`) so CSharpier covers all C# files in the project.
- Do NOT run `dotnet run` directly from `backend/` — it fails. Use `bun run dev` from `backend/` instead (it passes the correct `--project` flag automatically).
