# Agent Instructions

This is a full-stack TeleHealth application with React frontend, .NET backend, AWS Lambda functions, and Pulumi infrastructure.

## Quick Reference

- **Format code**: `bun x ultracite fix` | `dotnet csharpier format .`
- **Check for issues**: `bun x ultracite check` | `dotnet csharpier check .`
- **Diagnose setup**: `bun x ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

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
cd backend
bun run build        # Build solution
dotnet restore --locked-mode                    # Restore packages
dotnet csharpier check .                        # Check formatting
dotnet csharpier format .                       # Format code
dotnet tool restore                             # Restore local tools
```

**Run tests:**

```bash
cd backend
bun run test         # All unit tests
dotnet test tests/TeleHealth.UnitTests         # All unit tests
dotnet test --filter "FullyQualifiedName~BasicTests" # Single test class
dotnet test --filter "Name~Add_ReturnsSum"             # Single test method
```

### Global (root)

```bash
bun x ultracite fix     # Fix all frontend issues
bun x ultracite check   # Check all frontend issues
```

## Project Structure

```text
frontend/           # React 19 + TypeScript + Vite + Vitest
backend/            # .NET 10 API + Tests (Unit/Integration/E2E)
  src/
    TeleHealth.Api/
    TeleHealth.Contracts/    # Shared contracts library
  tests/
functions/          # AWS Lambda functions
infra/              # Pulumi infrastructure (C#)
```

**Key Configuration Files:**

- `.editorconfig` - C# formatting rules enforced
- `Directory.Build.props` - Shared MSBuild properties
- `global.json` - .NET SDK version (10.0.100)
- `frontend/vitest.config.ts` - Test projects: unit, browser, storybook

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
- Prefer explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers
- Always `await` promises in async functions
- Use `async/await` syntax instead of promise chains
- Handle errors appropriately in async code with try-catch blocks
- Use template literals over string concatenation
- Use destructuring for object and array assignments
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components

**Accessibility (ARIA):**

- Provide meaningful alt text for images
- Use proper heading hierarchy
- Add labels for form inputs
- Include keyboard event handlers alongside mouse events
- Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

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

## Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases
- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

## PII & Sensitive Data Handling

This is a healthcare application. All code must comply with general GDPR and general health data privacy standards (HIPAA). Treat the following as PII/PHI that must never appear in logs, exception messages, or API responses:

**Always PII — never log or expose:**

- Email addresses
- IC numbers  — also PHI under health data regulations
- Full names in combination with any other identifier
- Phone numbers
- Dates of birth combined with any other identifier
- Passwords or password hashes (any form)

**Internal identifiers — safe to log:**

- `PublicId` (GUIDs assigned by the system) — these are safe because they carry no real-world identity meaning on their own
- `Slug` values
- Appointment/schedule/record IDs

### Logging Rules

```csharp
// NEVER — logs PII directly
Log.Warning("Login failed for user: {Email}", command.Email);
Log.Warning("Duplicate IC detected: {IcNumber}", cmd.IcNumber);
Log.Information("Patient {Name} not found", patientName);
 
// CORRECT — log intent and internal IDs only
Log.Warning("Login failed — account not found.");
Log.Warning("Duplicate IC number registration attempt detected.");
Log.Warning("Patient not found. PatientId: {PatientId}", patient.PublicId);
```

For auth failures specifically, **both** "user not found" and "wrong password" must log the same generic message with no email attached. Distinguishing them in logs is an enumeration risk.

### API Response Rules

Exception `detail` fields are surfaced in ProblemDetails responses. Never include PII there:

```csharp
// NEVER — PII in API response detail
throw new ConflictException($"Email '{email}' is already registered.");
throw new NotFoundException($"Patient '{patientId}' was not found.");
 
// CORRECT — generic client detail, identifier in server log only
Log.Warning("Duplicate email registration attempt. Email: {Email}", email);
throw new DuplicateEmailException(); // detail: "An account with this email already exists."
```

### IC Numbers — Extra Caution

IC numbers are PHI. Do not log them under any circumstances, including for debugging duplicate-registration attempts. Trace those events via the audit log only. If you need to reference an IC-related event in application logs, log only that the event occurred — never the value.

---

## Security & Performance

- Add `rel="noopener"` on `target="_blank"` links
- Avoid `dangerouslySetInnerHTML` and `eval()`
- Validate and sanitize user input
- Never commit secrets or API keys
- Use Next.js `<Image>` component if using Next.js
- Never use spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)

## Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `bun x ultracite fix` before committing to ensure compliance.
