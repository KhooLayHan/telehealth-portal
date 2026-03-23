# Agent Instructions

This is a full-stack TeleHealth application with React frontend, .NET backend, AWS Lambda functions, and Pulumi infrastructure.

## Build/Test/Lint Commands

### Frontend (Bun + Vite)
```bash
cd frontend
bun install          # Install dependencies
bun run dev          # Start dev server
bun run build        # Production build
bun run check        # Lint check (ultracite/biome)
bun run fix          # Auto-fix linting issues
bun run test         # Run unit tests (vitest)
bun run test:browser # Run browser tests (playwright)
bun run coverage     # Run tests with coverage
```

**Run a single test file:**
```bash
cd frontend
bun run test -- src/components/Button.test.tsx
bun run test -- --test-name-pattern="should render"
```

### Backend (.NET 10)
```bash
dotnet restore --locked-mode                    # Restore packages
dotnet build backend/TeleHealth.slnx            # Build solution
dotnet csharpier check .                        # Check formatting
dotnet csharpier format .                       # Format code
dotnet tool restore                             # Restore local tools
```

**Run tests:**
```bash
dotnet test backend/tests/TeleHealth.UnitTests         # All unit tests
dotnet test --filter "FullyQualifiedName~BasicTests" # Single test class
dotnet test --filter "Name~Add_ReturnsSum"             # Single test method
```

### Global (root)
```bash
bun x ultracite fix     # Fix all frontend issues
bun x ultracite check   # Check all frontend issues
```

## Code Style Guidelines

### TypeScript/React (Frontend)
- **Formatter:** Biome via Ultracite
- Use arrow functions for callbacks; prefer `for...of` over `.forEach()`
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Use `const` by default, `let` only when needed, never `var`
- Call hooks at top level only, never conditionally
- Use function components; React 19+ uses ref as prop (no `forwardRef`)
- Use semantic HTML with ARIA attributes for accessibility
- Remove `console.log` and `debugger` from production code

### C# (Backend)
- **Formatter:** CSharpier (enforced in CI)
- **Target Framework:** .NET 10
- **Nullable:** Enabled | **ImplicitUsings:** Enabled
- **WarningsAsErrors:** Enabled | **AnalysisLevel:** latest-Recommended

**Naming Conventions:**
- PascalCase: types, interfaces (IPrefix), methods, properties, events, public fields
- camelCase: local variables, parameters, local constants
- _camelCase: private instance fields
- s_camelCase: private static fields

**Style Preferences:**
- Use file-scoped namespaces
- Use primary constructors where appropriate
- Prefer `var` only when type is apparent (disabled by default)
- Expression-bodied members for accessors/indexers
- Static local functions preferred
- Sort usings: System first, separate groups

### Testing Standards

**Frontend (Vitest):**
- Write assertions in `it()` or `test()` blocks
- Use async/await, avoid done callbacks
- Don't commit `.only` or `.skip`
- Keep test suites flat, avoid deep `describe` nesting

**Backend (TUnit):**
```csharp
[Test]
public async Task TestName()
{
    await Assert.That(result).IsEqualTo(expected);
}
```
- Use `[Before(Class)]` / `[After(Class)]` for setup/teardown
- Use `[Before(Test)]` / `[After(Test)]` for per-test hooks
- Use AwesomeAssertions for assertions, NSubstitute for mocking

## Project Structure

```bash
frontend/           # React 19 + TypeScript + Vite + Vitest
backend/            # .NET 10 API + Tests (Unit/Integration/E2E)
functions/          # AWS Lambda functions
infra/              # Pulumi infrastructure (C#)
```

**Key Configuration Files:**
- `.editorconfig` - C# formatting rules enforced
- `Directory.Build.props` - Shared MSBuild properties
- `global.json` - .NET SDK version (10.0.100)
- `frontend/vitest.config.ts` - Test projects: unit, browser, storybook

## Security & Performance

- Add `rel="noopener"` on `target="_blank"` links
- Avoid `dangerouslySetInnerHTML` and `eval()`
- Validate and sanitize user input
- Never commit secrets or API keys
- Use Next.js `<Image>` component if using Next.js
- Never use spread syntax in accumulators within loops
