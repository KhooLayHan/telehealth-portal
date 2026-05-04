# AWS cloud migration workflow overview

**Session ID:** ses_20f23725bffeyW75WqOVxz6UG7
**Created:** 5/4/2026, 10:41:19 AM
**Updated:** 5/4/2026, 10:58:21 AM

---

## User

Scan the project, explain to me in detail how the below workflows works:
1. Creating the cloud database service in AWS.
2. Migrating the data to cloud database service in AWS.
3. Steps for creating the system.
4. Deploying the system to AWS Compute services.

etc...

---

## Assistant (Plan · Kimi K2.6 · 25.8s)

---

## User

Proceed

---

## Assistant (Plan · Kimi K2.5 · 5.3s)

_Thinking:_

The user wants me to scan the project and explain how various AWS workflows work. Let me first explore the project structure to understand the codebase, particularly focusing on:
1. Infrastructure/Pulumi configuration
2. Backend services
3. Database configuration
4. Deployment workflows
5. Any documentation

Let me start by exploring the project structure.

I'll scan the project to understand how these AWS workflows work. Let me explore the infrastructure, backend, and deployment configurations.

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/infra/**/*.cs"
}
```

**Output:**
```
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Storage.cs
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Serverless.cs
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Program.cs
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Observability.cs
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Networking.cs
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Compute.cs
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Messaging.cs
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Config.cs
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Database.cs
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/infra/**/*.ts"
}
```

**Output:**
```
No files found
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/.github/workflows/*.yml"
}
```

**Output:**
```
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/ci-frontend.yml
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/ci-backend.yml
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-lambda.yml
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-seed.yml
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-infra.yml
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-backend.yml
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-deploy.yml
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-frontend.yml
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/AGENTS.md"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/AGENTS.md</path>
<type>file</type>
<content>
1: # Agent Instructions
2: 
3: This is a full-stack TeleHealth application with React frontend, .NET backend, AWS Lambda functions, and Pulumi infrastructure.
4: 
5: ## Quick Reference
6: 
7: - **Format code**: `bun x ultracite fix` | `dotnet csharpier format .`
8: - **Check for issues**: `bun x ultracite check` | `dotnet csharpier check .`
9: - **Diagnose setup**: `bun x ultracite doctor`
10: 
11: Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.
12: 
13: ## Build/Test/Lint Commands
14: 
15: ### Frontend (Bun + Vite)
16: 
17: ```bash
18: cd frontend
19: bun install          # Install dependencies
20: bun run dev          # Start dev server
21: bun run build        # Production build
22: bun run check        # Lint check (ultracite/biome)
23: bun run fix          # Auto-fix linting issues
24: bun run test         # Run unit tests (vitest)
25: bun run test:browser # Run browser tests (playwright)
26: bun run coverage     # Run tests with coverage
27: ```
28: 
29: **Run a single test file:**
30: 
31: ```bash
32: cd frontend
33: bun run test -- src/components/Button.test.tsx
34: bun run test -- --test-name-pattern="should render"
35: ```
36: 
37: ### Backend (.NET 10)
38: 
39: ```bash
40: cd backend
41: bun run build        # Build solution
42: dotnet restore --locked-mode                    # Restore packages
43: dotnet csharpier check .                        # Check formatting
44: dotnet csharpier format .                       # Format code
45: dotnet tool restore                             # Restore local tools
46: ```
47: 
48: **Run tests:**
49: 
50: ```bash
51: cd backend
52: bun run test         # All unit tests
53: dotnet test tests/TeleHealth.UnitTests         # All unit tests
54: dotnet test --filter "FullyQualifiedName~BasicTests" # Single test class
55: dotnet test --filter "Name~Add_ReturnsSum"             # Single test method
56: ```
57: 
58: ### Global (root)
59: 
60: ```bash
61: bun x ultracite fix     # Fix all frontend issues
62: bun x ultracite check   # Check all frontend issues
63: ```
64: 
65: ## Project Structure
66: 
67: ```text
68: frontend/           # React 19 + TypeScript + Vite + Vitest
69: backend/            # .NET 10 API + Tests (Unit/Integration/E2E)
70:   src/
71:     TeleHealth.Api/
72:     TeleHealth.Contracts/    # Shared contracts library
73:   tests/
74: functions/          # AWS Lambda functions
75: infra/              # Pulumi infrastructure (C#)
76: ```
77: 
78: **Key Configuration Files:**
79: 
80: - `.editorconfig` - C# formatting rules enforced
81: - `Directory.Build.props` - Shared MSBuild properties
82: - `global.json` - .NET SDK version (10.0.100)
83: - `frontend/vitest.config.ts` - Test projects: unit, browser, storybook
84: 
85: ## Code Style Guidelines
86: 
87: ### TypeScript/React (Frontend)
88: 
89: - **Formatter:** Biome via Ultracite
90: - Use arrow functions for callbacks; prefer `for...of` over `.forEach()`
91: - Use optional chaining (`?.`) and nullish coalescing (`??`)
92: - Use `const` by default, `let` only when needed, never `var`
93: - Call hooks at top level only, never conditionally
94: - Use function components; React 19+ uses ref as prop (no `forwardRef`)
95: - Use semantic HTML with ARIA attributes for accessibility
96: - Remove `console.log` and `debugger` from production code
97: - Prefer explicit types for function parameters and return values when they enhance clarity
98: - Prefer `unknown` over `any` when the type is genuinely unknown
99: - Use const assertions (`as const`) for immutable values and literal types
100: - Leverage TypeScript's type narrowing instead of type assertions
101: - Use meaningful variable names instead of magic numbers
102: - Always `await` promises in async functions
103: - Use `async/await` syntax instead of promise chains
104: - Handle errors appropriately in async code with try-catch blocks
105: - Use template literals over string concatenation
106: - Use destructuring for object and array assignments
107: - Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
108: - Nest children between opening and closing tags instead of passing as props
109: - Don't define components inside other components
110: 
111: **Accessibility (ARIA):**
112: 
113: - Provide meaningful alt text for images
114: - Use proper heading hierarchy
115: - Add labels for form inputs
116: - Include keyboard event handlers alongside mouse events
117: - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles
118: 
119: ### C# (Backend)
120: 
121: - **Formatter:** CSharpier (enforced in CI)
122: - **Target Framework:** .NET 10
123: - **Nullable:** Enabled | **ImplicitUsings:** Enabled
124: - **WarningsAsErrors:** Enabled | **AnalysisLevel:** latest-Recommended
125: 
126: **Naming Conventions:**
127: 
128: - PascalCase: types, interfaces (IPrefix), methods, properties, events, public fields
129: - camelCase: local variables, parameters, local constants
130: - _camelCase: private instance fields
131: - s_camelCase: private static fields
132: 
133: **Style Preferences:**
134: 
135: - Use file-scoped namespaces
136: - Use primary constructors where appropriate
137: - Prefer `var` only when type is apparent (disabled by default)
138: - Expression-bodied members for accessors/indexers
139: - Static local functions preferred
140: - Sort usings: System first, separate groups
141: 
142: ### Testing Standards
143: 
144: **Frontend (Vitest):**
145: 
146: - Write assertions in `it()` or `test()` blocks
147: - Use async/await, avoid done callbacks
148: - Don't commit `.only` or `.skip`
149: - Keep test suites flat, avoid deep `describe` nesting
150: 
151: **Backend (TUnit):**
152: 
153: ```csharp
154: [Test]
155: public async Task TestName()
156: {
157:     await Assert.That(result).IsEqualTo(expected);
158: }
159: ```
160: 
161: - Use `[Before(Class)]` / `[After(Class)]` for setup/teardown
162: - Use `[Before(Test)]` / `[After(Test)]` for per-test hooks
163: - Use AwesomeAssertions for assertions, NSubstitute for mocking
164: 
165: ## Error Handling & Debugging
166: 
167: - Remove `console.log`, `debugger`, and `alert` statements from production code
168: - Throw `Error` objects with descriptive messages, not strings or other values
169: - Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
170: - Prefer early returns over nested conditionals for error cases
171: - Keep functions focused and under reasonable cognitive complexity limits
172: - Extract complex conditions into well-named boolean variables
173: - Use early returns to reduce nesting
174: - Prefer simple conditionals over nested ternary operators
175: - Group related code together and separate concerns
176: 
177: ## PII & Sensitive Data Handling
178: 
179: This is a healthcare application. All code must comply with general GDPR and general health data privacy standards (HIPAA). Treat the following as PII/PHI that must never appear in logs, exception messages, or API responses:
180: 
181: **Always PII — never log or expose:**
182: 
183: - Email addresses
184: - IC numbers  — also PHI under health data regulations
185: - Full names in combination with any other identifier
186: - Phone numbers
187: - Dates of birth combined with any other identifier
188: - Passwords or password hashes (any form)
189: 
190: **Internal identifiers — safe to log:**
191: 
192: - `PublicId` (GUIDs assigned by the system) — these are safe because they carry no real-world identity meaning on their own
193: - `Slug` values
194: - Appointment/schedule/record IDs
195: 
196: ### Logging Rules
197: 
198: ```csharp
199: // NEVER — logs PII directly
200: Log.Warning("Login failed for user: {Email}", command.Email);
201: Log.Warning("Duplicate IC detected: {IcNumber}", cmd.IcNumber);
202: Log.Information("Patient {Name} not found", patientName);
203:  
204: // CORRECT — log intent and internal IDs only
205: Log.Warning("Login failed — account not found.");
206: Log.Warning("Duplicate IC number registration attempt detected.");
207: Log.Warning("Patient not found. PatientId: {PatientId}", patient.PublicId);
208: ```
209: 
210: For auth failures specifically, **both** "user not found" and "wrong password" must log the same generic message with no email attached. Distinguishing them in logs is an enumeration risk.
211: 
212: ### API Response Rules
213: 
214: Exception `detail` fields are surfaced in ProblemDetails responses. Never include PII there:
215: 
216: ```csharp
217: // NEVER — PII in API response detail
218: throw new ConflictException($"Email '{email}' is already registered.");
219: throw new NotFoundException($"Patient '{patientId}' was not found.");
220:  
221: // CORRECT — generic client detail, identifier in server log only
222: Log.Warning("Duplicate email registration attempt. Email: {Email}", email);
223: throw new DuplicateEmailException(); // detail: "An account with this email already exists."
224: ```
225: 
226: ### IC Numbers — Extra Caution
227: 
228: IC numbers are PHI. Do not log them under any circumstances, including for debugging duplicate-registration attempts. Trace those events via the audit log only. If you need to reference an IC-related event in application logs, log only that the event occurred — never the value.
229: 
230: ---
231: 
232: ## Security & Performance
233: 
234: - Add `rel="noopener"` on `target="_blank"` links
235: - Avoid `dangerouslySetInnerHTML` and `eval()`
236: - Validate and sanitize user input
237: - Never commit secrets or API keys
238: - Use Next.js `<Image>` component if using Next.js
239: - Never use spread syntax in accumulators within loops
240: - Use top-level regex literals instead of creating them in loops
241: - Prefer specific imports over namespace imports
242: - Avoid barrel files (index files that re-export everything)
243: 
244: ## Framework-Specific Guidance
245: 
246: **Next.js:**
247: 
248: - Use Next.js `<Image>` component for images
249: - Use `next/head` or App Router metadata API for head elements
250: - Use Server Components for async data fetching instead of async Client Components
251: 
252: **React 19+:**
253: 
254: - Use ref as a prop instead of `React.forwardRef`
255: 
256: **Solid/Svelte/Vue/Qwik:**
257: 
258: - Use `class` and `for` attributes (not `className` or `htmlFor`)
259: 
260: ## When Biome Can't Help
261: 
262: Biome's linter will catch most issues automatically. Focus your attention on:
263: 
264: 1. **Business logic correctness** - Biome can't validate your algorithms
265: 2. **Meaningful naming** - Use descriptive names for functions, variables, and types
266: 3. **Architecture decisions** - Component structure, data flow, and API design
267: 4. **Edge cases** - Handle boundary conditions and error states
268: 5. **User experience** - Accessibility, performance, and usability considerations
269: 6. **Documentation** - Add comments for complex logic, but prefer self-documenting code
270: 
271: ---
272: 
273: Most formatting and common issues are automatically fixed by Biome. Run `bun x ultracite fix` before committing to ensure compliance.

(End of file - total 273 lines)
</content>
```

---

## Assistant (Plan · Kimi K2.5 · 5.9s)

_Thinking:_

Now let me read the infrastructure files, particularly Database.cs, CDK workflows, and backend configurations to understand the deployment process.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Database.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Database.cs</path>
<type>file</type>
<content>
1: namespace TeleHealth.Infra;
2: 
3: using Pulumi;
4: using Aws = Pulumi.Aws;
5: 
6: /// <summary>
7: /// Secrets Manager and RDS PostgreSQL with security hardening:
8: ///   - PubliclyAccessible = false (DB not on public internet)
9: ///   - StorageEncrypted = true (encryption at rest, free)
10: ///   - BackupRetentionPeriod = 7 (7-day automated backups)
11: ///   - Security group: EB-only ingress
12: ///   - CloudWatch log exports enabled
13: ///   - Enhanced monitoring + Performance Insights
14: /// </summary>
15: public static class Database
16: {
17:     public sealed class Result
18:     {
19:         public required Aws.SecretsManager.Secret DbSecret { get; init; }
20:         public required Aws.Rds.Instance Instance { get; init; }
21:     }
22: 
23:     public static Result Create(StackConfig cfg, Networking.Result net)
24:     {
25:         // ── Secrets Manager — DB password stored as a managed secret ──
26:         var dbSecret = new Aws.SecretsManager.Secret(
27:             "telehealth-db-secret",
28:             new Aws.SecretsManager.SecretArgs
29:             {
30:                 Name = $"telehealth/{cfg.StackName}/db-password",
31:                 Description = $"RDS PostgreSQL password for TeleHealth {cfg.StackName} environment",
32:                 RecoveryWindowInDays = 0, // Immediate deletion — set >=7 for production
33:                 Tags = cfg.Tags,
34:             }
35:         );
36: 
37:         _ = new Aws.SecretsManager.SecretVersion(
38:             "telehealth-db-secret-version",
39:             new Aws.SecretsManager.SecretVersionArgs
40:             {
41:                 SecretId = dbSecret.Id,
42:                 SecretString = cfg.DbPassword,
43:             }
44:         );
45: 
46:         // ── RDS enhanced monitoring IAM role ──
47:         var rdsMonitoringRole = new Aws.Iam.Role(
48:             "rds-monitoring-role",
49:             new Aws.Iam.RoleArgs
50:             {
51:                 AssumeRolePolicy =
52:                     @"{
53:                     ""Version"": ""2012-10-17"",
54:                     ""Statement"": [{
55:                         ""Action"": ""sts:AssumeRole"",
56:                         ""Principal"": { ""Service"": ""monitoring.rds.amazonaws.com"" },
57:                         ""Effect"": ""Allow""
58:                     }]
59:                 }",
60:             }
61:         );
62: 
63:         _ = new Aws.Iam.RolePolicyAttachment(
64:             "rds-monitoring-policy",
65:             new Aws.Iam.RolePolicyAttachmentArgs
66:             {
67:                 Role = rdsMonitoringRole.Name,
68:                 PolicyArn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
69:             }
70:         );
71: 
72:         // ── RDS PostgreSQL instance ──
73:         var database = new Aws.Rds.Instance(
74:             "telehealth-db",
75:             new Aws.Rds.InstanceArgs
76:             {
77:                 Engine = "postgres",
78:                 EngineVersion = "18.3",
79:                 InstanceClass = cfg.DbInstanceClass,
80:                 AllocatedStorage = 20,
81:                 DbName = cfg.DbName,
82:                 Username = cfg.DbUsername,
83:                 Password = cfg.DbPassword,
84:                 VpcSecurityGroupIds = { net.DbSecurityGroup.Id },
85:                 DbSubnetGroupName = net.DbSubnetGroup.Name,
86: 
87:                 // Security hardening
88:                 PubliclyAccessible = false,
89:                 StorageEncrypted = true,
90: 
91:                 // Backup & snapshot policy
92:                 BackupRetentionPeriod = 7,
93:                 BackupWindow = "03:00-04:00",
94:                 MaintenanceWindow = "sun:04:30-sun:05:30",
95:                 SkipFinalSnapshot = cfg.SkipFinalSnapshot,
96:                 FinalSnapshotIdentifier = cfg.SkipFinalSnapshot
97:                     ? null!
98:                     : $"telehealth-db-{cfg.StackName}-final",
99: 
100:                 // Observability
101:                 MonitoringInterval = 60,
102:                 MonitoringRoleArn = rdsMonitoringRole.Arn,
103:                 PerformanceInsightsEnabled = true,
104:                 EnabledCloudwatchLogsExports = { "postgresql", "upgrade" },
105: 
106:                 Tags = cfg.Tags,
107:             },
108:             new CustomResourceOptions { Protect = true }
109:         );
110: 
111:         return new Result { DbSecret = dbSecret, Instance = database };
112:     }
113: }

(End of file - total 113 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Program.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Program.cs</path>
<type>file</type>
<content>
1: ﻿using System.Collections.Generic;
2: using Pulumi;
3: using TeleHealth.Infra;
4: 
5: return await Deployment.RunAsync(() =>
6: {
7:     var cfg = new StackConfig();
8: 
9:     // Create resources in dependency order
10:     var net = Networking.Create(cfg);
11:     var storage = Storage.Create(cfg);
12:     var msg = Messaging.Create(cfg);
13:     var db = Database.Create(cfg, net);
14:     var obs = Observability.Create(cfg, db, msg);
15:     var compute = Compute.Create(cfg, net, storage, db, msg, obs);
16:     var serverless = Serverless.Create(cfg, msg, storage);
17: 
18:     // Stack outputs — used by GitHub Actions CD workflow
19:     return new Dictionary<string, object?>
20:     {
21:         ["FrontendUrl"] = storage.FrontendWebsiteConfig.WebsiteEndpoint,
22:         ["ApiUrl"] = compute.EbEnv.EndpointUrl,
23:         ["DatabaseEndpoint"] = db.Instance.Endpoint,
24:         ["DatabaseAddress"] = db.Instance.Address,
25:         ["S3LabReportsBucket"] = storage.LabReportsBucket.BucketName,
26:         ["S3ArtifactsBucket"] = storage.ArtifactsBucket.BucketName,
27:         ["SnsTopicArn"] = msg.MedicalAlertsTopic.Arn,
28:         ["SqsQueueUrl"] = msg.ProcessingQueue.Id,
29:         ["DlqUrl"] = msg.DeadLetterQueue.Id,
30:         ["FrontendBucketName"] = storage.FrontendBucket.BucketName,
31:         ["EbAppName"] = compute.EbApp.Name,
32:         ["EbEnvName"] = compute.EbEnv.Name,
33:         ["EcrRepositoryUrl"] = compute.EcrRepo.RepositoryUrl,
34:         ["DbSecretArn"] = db.DbSecret.Arn,
35:         ["XRayGroupArn"] = obs.XrayGroup.Arn,
36:         ["ApiLogGroupName"] = obs.ApiLogGroup.Name,
37:         ["LambdaFunctionName"] = serverless.PdfProcessorLambda.Name,
38:         ["ReminderLambdaName"] = serverless.ReminderLambda.Name,
39:         ["NotificationsLambdaName"] = serverless.NotificationsLambda.Name,
40:     };
41: });

(End of file - total 41 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Compute.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Compute.cs</path>
<type>file</type>
<content>
1: namespace TeleHealth.Infra;
2: 
3: using Pulumi;
4: using Aws = Pulumi.Aws;
5: 
6: /// <summary>
7: /// ECR repository, IAM role with scoped policies, instance profile,
8: /// and Elastic Beanstalk application + environment.
9: ///
10: /// IAM follows least-privilege: only managed policies for broad AWS
11: /// service integration (EB Web Tier, ECR read, X-Ray), with scoped
12: /// inline policies for SQS, SNS, CloudWatch Logs, S3, and Secrets Manager.
13: /// </summary>
14: public static class Compute
15: {
16:     public sealed class Result
17:     {
18:         public required Aws.Ecr.Repository EcrRepo { get; init; }
19:         public required Aws.ElasticBeanstalk.Application EbApp { get; init; }
20:         public required Aws.ElasticBeanstalk.Environment EbEnv { get; init; }
21:     }
22: 
23:     public static Result Create(
24:         StackConfig cfg,
25:         Networking.Result net,
26:         Storage.Result storage,
27:         Database.Result db,
28:         Messaging.Result msg,
29:         Observability.Result obs
30:     )
31:     {
32:         // ── ECR — Docker image registry ──
33:         var ecrRepo = new Aws.Ecr.Repository(
34:             "telehealth-api-repo",
35:             new Aws.Ecr.RepositoryArgs
36:             {
37:                 Name = $"telehealth-api-{cfg.StackName}",
38:                 ImageTagMutability = "MUTABLE",
39:                 ImageScanningConfiguration =
40:                     new Aws.Ecr.Inputs.RepositoryImageScanningConfigurationArgs
41:                     {
42:                         ScanOnPush = true,
43:                     },
44:                 Tags = cfg.Tags,
45:             }
46:         );
47: 
48:         _ = new Aws.Ecr.LifecyclePolicy(
49:             "telehealth-api-lifecycle",
50:             new Aws.Ecr.LifecyclePolicyArgs
51:             {
52:                 Repository = ecrRepo.Name,
53:                 Policy =
54:                     @"{
55:                     ""rules"": [
56:                         {
57:                             ""rulePriority"": 1,
58:                             ""description"": ""Remove untagged images after 1 day"",
59:                             ""selection"": { ""tagStatus"": ""untagged"", ""countType"": ""sinceImagePushed"", ""countUnit"": ""days"", ""countNumber"": 1 },
60:                             ""action"": { ""type"": ""expire"" }
61:                         },
62:                         {
63:                             ""rulePriority"": 2,
64:                             ""description"": ""Keep last 10 tagged images"",
65:                             ""selection"": { ""tagStatus"": ""any"", ""countType"": ""imageCountMoreThan"", ""countNumber"": 10 },
66:                             ""action"": { ""type"": ""expire"" }
67:                         }
68:                     ]
69:                 }",
70:             }
71:         );
72: 
73:         // ── IAM — EB EC2 instance role ──
74:         var ebRole = new Aws.Iam.Role(
75:             "eb-ec2-role",
76:             new Aws.Iam.RoleArgs
77:             {
78:                 AssumeRolePolicy =
79:                     @"{
80:                     ""Version"": ""2012-10-17"",
81:                     ""Statement"": [{
82:                         ""Action"": ""sts:AssumeRole"",
83:                         ""Principal"": { ""Service"": ""ec2.amazonaws.com"" },
84:                         ""Effect"": ""Allow""
85:                     }]
86:                 }",
87:                 Tags = cfg.Tags,
88:             }
89:         );
90: 
91:         // Managed policies — only for broad AWS-service integration
92:         foreach (
93:             var (suffix, policyArn) in new[]
94:             {
95:                 ("eb-web-tier", "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"),
96:                 ("eb-ecr-readonly", "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"),
97:                 ("eb-xray", "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"),
98:                 ("eb-ssm", "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"),
99:             }
100:         )
101:         {
102:             _ = new Aws.Iam.RolePolicyAttachment(
103:                 $"policy-{suffix}",
104:                 new Aws.Iam.RolePolicyAttachmentArgs { Role = ebRole.Name, PolicyArn = policyArn }
105:             );
106:         }
107: 
108:         // Scoped inline policy: SQS — processing queue + MassTransit queue management
109:         _ = new Aws.Iam.RolePolicy(
110:             "policy-sqs-scoped",
111:             new Aws.Iam.RolePolicyArgs
112:             {
113:                 Role = ebRole.Name,
114:                 Policy = msg.ProcessingQueue.Arn.Apply(queueArn =>
115:                     $@"{{
116:                         ""Version"": ""2012-10-17"",
117:                         ""Statement"": [
118:                             {{
119:                                 ""Sid"": ""ProcessingQueue"",
120:                                 ""Effect"": ""Allow"",
121:                                 ""Action"": [""sqs:SendMessage"",""sqs:ReceiveMessage"",""sqs:DeleteMessage"",""sqs:GetQueueAttributes""],
122:                                 ""Resource"": ""{queueArn}""
123:                             }},
124:                             {{
125:                                 ""Sid"": ""MassTransitSqsManagement"",
126:                                 ""Effect"": ""Allow"",
127:                                 ""Action"": [
128:                                     ""sqs:CreateQueue"",
129:                                     ""sqs:DeleteQueue"",
130:                                     ""sqs:GetQueueUrl"",
131:                                     ""sqs:GetQueueAttributes"",
132:                                     ""sqs:SetQueueAttributes"",
133:                                     ""sqs:PurgeQueue"",
134:                                     ""sqs:ListQueues"",
135:                                     ""sqs:SendMessage"",
136:                                     ""sqs:ReceiveMessage"",
137:                                     ""sqs:DeleteMessage""
138:                                 ],
139:                                 ""Resource"": ""arn:aws:sqs:{cfg.AwsRegion}:*:*""
140:                             }}
141:                         ]
142:                     }}"
143:                 ),
144:             }
145:         );
146: 
147:         // Scoped inline policy: SNS — publish + MassTransit topic management
148:         _ = new Aws.Iam.RolePolicy(
149:             "policy-sns-scoped",
150:             new Aws.Iam.RolePolicyArgs
151:             {
152:                 Role = ebRole.Name,
153:                 Policy = msg.MedicalAlertsTopic.Arn.Apply(topicArn =>
154:                     $@"{{
155:                         ""Version"": ""2012-10-17"",
156:                         ""Statement"": [
157:                             {{
158:                                 ""Sid"": ""MedicalAlertsTopic"",
159:                                 ""Effect"": ""Allow"",
160:                                 ""Action"": [""sns:Publish""],
161:                                 ""Resource"": ""{topicArn}""
162:                             }},
163:                             {{
164:                                 ""Sid"": ""MassTransitSnsManagement"",
165:                                 ""Effect"": ""Allow"",
166:                                 ""Action"": [
167:                                     ""sns:CreateTopic"",
168:                                     ""sns:DeleteTopic"",
169:                                     ""sns:GetTopicAttributes"",
170:                                     ""sns:SetTopicAttributes"",
171:                                     ""sns:ListTopics"",
172:                                     ""sns:Subscribe"",
173:                                     ""sns:Unsubscribe"",
174:                                     ""sns:Publish""
175:                                 ],
176:                                 ""Resource"": ""arn:aws:sns:{cfg.AwsRegion}:*:*""
177:                             }}
178:                         ]
179:                     }}"
180:                 ),
181:             }
182:         );
183: 
184:         // Scoped inline policy: CloudWatch Logs — only the API log group
185:         _ = new Aws.Iam.RolePolicy(
186:             "policy-cloudwatch-logs-scoped",
187:             new Aws.Iam.RolePolicyArgs
188:             {
189:                 Role = ebRole.Name,
190:                 Policy = obs.ApiLogGroup.Arn.Apply(logGroupArn =>
191:                     $@"{{
192:                         ""Version"": ""2012-10-17"",
193:                         ""Statement"": [{{
194:                             ""Effect"": ""Allow"",
195:                             ""Action"": [""logs:CreateLogStream"",""logs:PutLogEvents"",""logs:DescribeLogStreams""],
196:                             ""Resource"": [""{logGroupArn}"",""{logGroupArn}:*""]
197:                         }}]
198:                     }}"
199:                 ),
200:             }
201:         );
202: 
203:         // Scoped inline policy: S3 — only the lab-reports bucket
204:         _ = new Aws.Iam.RolePolicy(
205:             "policy-s3-lab-reports",
206:             new Aws.Iam.RolePolicyArgs
207:             {
208:                 Role = ebRole.Name,
209:                 Policy = storage.LabReportsBucket.Arn.Apply(arn =>
210:                     $@"{{
211:                         ""Version"": ""2012-10-17"",
212:                         ""Statement"": [{{
213:                             ""Effect"": ""Allow"",
214:                             ""Action"": [""s3:PutObject"",""s3:GetObject"",""s3:DeleteObject"",""s3:ListBucket""],
215:                             ""Resource"": [""{arn}"",""{arn}/*""]
216:                         }}]
217:                     }}"
218:                 ),
219:             }
220:         );
221: 
222:         // Scoped inline policy: Secrets Manager — only the DB secret
223:         _ = new Aws.Iam.RolePolicy(
224:             "policy-secrets-manager",
225:             new Aws.Iam.RolePolicyArgs
226:             {
227:                 Role = ebRole.Name,
228:                 Policy = db.DbSecret.Arn.Apply(arn =>
229:                     $@"{{
230:                         ""Version"": ""2012-10-17"",
231:                         ""Statement"": [{{
232:                             ""Effect"": ""Allow"",
233:                             ""Action"": [""secretsmanager:GetSecretValue""],
234:                             ""Resource"": ""{arn}""
235:                         }}]
236:                     }}"
237:                 ),
238:             }
239:         );
240: 
241:         // Scoped inline policy: SES send email for appointment reminder feature
242:         _ = new Aws.Iam.RolePolicy(
243:             "policy-ses-scoped",
244:             new Aws.Iam.RolePolicyArgs
245:             {
246:                 Role = ebRole.Name,
247:                 Policy =
248:                     @"{
249:                         ""Version"": ""2012-10-17"",
250:                         ""Statement"": [{
251:                             ""Effect"": ""Allow"",
252:                             ""Action"": [""ses:SendEmail"", ""ses:SendRawEmail""],
253:                             ""Resource"": ""*""
254:                         }]
255:                     }",
256:             }
257:         );
258: 
259:         var instanceProfile = new Aws.Iam.InstanceProfile(
260:             "eb-instance-profile",
261:             new Aws.Iam.InstanceProfileArgs { Role = ebRole.Name }
262:         );
263: 
264:         // ── Elastic Beanstalk ──
265:         var ebApp = new Aws.ElasticBeanstalk.Application(
266:             "telehealth-api",
267:             new Aws.ElasticBeanstalk.ApplicationArgs { Tags = cfg.Tags }
268:         );
269: 
270:         var ebEnv = new Aws.ElasticBeanstalk.Environment(
271:             "telehealth-env",
272:             new Aws.ElasticBeanstalk.EnvironmentArgs
273:             {
274:                 Application = ebApp.Name,
275:                 SolutionStackName = "64bit Amazon Linux 2023 v4.12.1 running Docker",
276:                 Settings = new[]
277:                 {
278:                     // -- Instance & networking --
279:                     EbSetting(
280:                         "aws:autoscaling:launchconfiguration",
281:                         "IamInstanceProfile",
282:                         instanceProfile.Name
283:                     ),
284:                     EbSetting("aws:autoscaling:launchconfiguration", "InstanceType", "t3.micro"),
285:                     EbSetting(
286:                         "aws:autoscaling:launchconfiguration",
287:                         "SecurityGroups",
288:                         net.EbSecurityGroup.Id
289:                     ),
290:                     EbSetting(
291:                         "aws:elasticbeanstalk:environment",
292:                         "EnvironmentType",
293:                         "SingleInstance"
294:                     ),
295:                     // -- CloudWatch log streaming --
296:                     EbSetting("aws:elasticbeanstalk:cloudwatch:logs", "StreamLogs", "true"),
297:                     EbSetting("aws:elasticbeanstalk:cloudwatch:logs", "DeleteOnTerminate", "false"),
298:                     EbSetting("aws:elasticbeanstalk:cloudwatch:logs", "RetentionInDays", "30"),
299:                     // -- X-Ray daemon --
300:                     EbSetting("aws:elasticbeanstalk:xray", "XRayEnabled", "true"),
301:                     // -- App environment variables --
302:                     EbEnvVar("ASPNETCORE_ENVIRONMENT", "Production"),
303:                     EbEnvVar("ASPNETCORE_HTTP_PORTS", "8080"),
304:                     EbEnvVar(
305:                         "Cors__AllowedOrigins",
306:                         storage.FrontendBucket.WebsiteEndpoint.Apply(ep =>
307:                             $"http://{ep},https://www.telehealth.foo,https://telehealth.foo"
308:                         )
309:                     ),
310:                     // DB connection — full Npgsql connection string for ASP.NET Core
311:                     EbEnvVar(
312:                         "ConnectionStrings__Database",
313:                         Output
314:                             .Tuple(db.Instance.Address, cfg.DbPassword)
315:                             .Apply(t =>
316:                                 $"Host={t.Item1};Port=5432;Database={cfg.DbName};Username={cfg.DbUsername};Password={t.Item2};SSL Mode=Prefer"
317:                             )
318:                     ),
319:                     EbEnvVar("DB_SECRET_ARN", db.DbSecret.Arn),
320:                     // AWS service references
321:                     EbEnvVar("AWS_REGION", cfg.AwsRegion),
322:                     EbEnvVar("AWS_S3_LAB_REPORTS_BUCKET", storage.LabReportsBucket.BucketName),
323:                     EbEnvVar("AWS_SNS_TOPIC_ARN", msg.MedicalAlertsTopic.Arn),
324:                     EbEnvVar("AWS_SQS_QUEUE_URL", msg.ProcessingQueue.Id),
325:                     EbEnvVar("SES_SENDER_EMAIL", "hongjx0321@gmail.com"),
326:                     EbEnvVar("SES_REGION", "us-east-1"),
327:                     // JWT authentication
328:                     EbEnvVar("Jwt__Secret", cfg.JwtSecret),
329:                     EbEnvVar("Jwt__Issuer", "telehealth-api"),
330:                     EbEnvVar("Jwt__Audience", "telehealth-web"),
331:                     EbEnvVar("Jwt__ExpiryMinutes", "60"),
332:                     // -- VPC placement --
333:                     EbSetting("aws:ec2:vpc", "VPCId", net.VpcId),
334:                     EbSetting(
335:                         "aws:ec2:vpc",
336:                         "Subnets",
337:                         net.SubnetIds.Apply(ids => string.Join(",", ids))
338:                     ),
339:                 },
340:                 Tags = cfg.Tags,
341:             }
342:         );
343: 
344:         return new Result
345:         {
346:             EcrRepo = ecrRepo,
347:             EbApp = ebApp,
348:             EbEnv = ebEnv,
349:         };
350:     }
351: 
352:     // Helper to reduce EB setting boilerplate
353:     private static Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs EbSetting(
354:         string ns,
355:         string name,
356:         Input<string> value
357:     ) =>
358:         new()
359:         {
360:             Namespace = ns,
361:             Name = name,
362:             Value = value,
363:         };
364: 
365:     private static Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs EbEnvVar(
366:         string name,
367:         Input<string> value
368:     ) => EbSetting("aws:elasticbeanstalk:application:environment", name, value);
369: }

(End of file - total 369 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-infra.yml"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-infra.yml</path>
<type>file</type>
<content>
1: name: CD — Infrastructure (Pulumi)
2: 
3: on:
4:   workflow_call:
5:     inputs:
6:       aws-region:
7:         required: true
8:         type: string
9:     secrets:
10:       AWS_DEPLOY_ROLE_ARN:
11:         required: true
12:       PULUMI_ACCESS_TOKEN:
13:         required: true
14:     outputs:
15:       frontend-bucket:
16:         value: ${{ jobs.deploy-infra.outputs.frontend-bucket }}
17:       artifacts-bucket:
18:         value: ${{ jobs.deploy-infra.outputs.artifacts-bucket }}
19:       eb-app-name:
20:         value: ${{ jobs.deploy-infra.outputs.eb-app-name }}
21:       eb-env-name:
22:         value: ${{ jobs.deploy-infra.outputs.eb-env-name }}
23:       ecr-url:
24:         value: ${{ jobs.deploy-infra.outputs.ecr-url }}
25:       lambda-function-name:
26:         value: ${{ jobs.deploy-infra.outputs.lambda-function-name }}
27:       reminder-lambda-name:
28:         value: ${{ jobs.deploy-infra.outputs.reminder-lambda-name }}
29:       notifications-lambda-name:
30:         value: ${{ jobs.deploy-infra.outputs.notifications-lambda-name }}
31: 
32: jobs:
33:   deploy-infra:
34:     name: Pulumi — Provision Infrastructure
35:     runs-on: ubuntu-latest
36:     permissions:
37:       id-token: write
38:       contents: read
39:     outputs:
40:       frontend-bucket:      ${{ steps.pulumi.outputs.FrontendBucketName }}
41:       artifacts-bucket:     ${{ steps.pulumi.outputs.S3ArtifactsBucket }}
42:       eb-app-name:          ${{ steps.pulumi.outputs.EbAppName }}
43:       eb-env-name:          ${{ steps.pulumi.outputs.EbEnvName }}
44:       ecr-url:              ${{ steps.pulumi.outputs.EcrRepositoryUrl }}
45:       lambda-function-name: ${{ steps.pulumi.outputs.LambdaFunctionName }}
46:       reminder-lambda-name:        ${{ steps.pulumi.outputs.ReminderLambdaName }}
47:       notifications-lambda-name:   ${{ steps.pulumi.outputs.NotificationsLambdaName }}
48:     steps:
49:       - name: Checkout
50:         uses: actions/checkout@v4
51: 
52:       - name: Configure AWS credentials (OIDC)
53:         uses: aws-actions/configure-aws-credentials@v4
54:         with:
55:           role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
56:           aws-region: ${{ inputs.aws-region }}
57: 
58:       - name: Setup .NET (required by Pulumi C# program)
59:         uses: actions/setup-dotnet@v4
60:         with:
61:           dotnet-version: "9.0.x"
62: 
63:       - name: Pulumi up
64:         uses: pulumi/actions@v6
65:         id: pulumi
66:         with:
67:           command: up
68:           stack-name: prod
69:           work-dir: infra
70:           upsert: true
71:           refresh: true
72:         env:
73:           PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}

(End of file - total 73 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-deploy.yml"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-deploy.yml</path>
<type>file</type>
<content>
1: name: CD — Deploy to AWS
2: 
3: on:
4:   push:
5:     branches: ["main"]
6:     paths:
7:       - "Directory.Build.props"
8:       - "Directory.Packages.props"
9:       - "backend/**"
10:       - "frontend/**"
11:       - "infra/**"
12:       - "functions/**"
13:       - ".github/workflows/cd-deploy.yml"
14:       - ".github/workflows/cd-infra.yml"
15:       - ".github/workflows/cd-frontend.yml"
16:       - ".github/workflows/cd-backend.yml"
17:       - ".github/workflows/cd-lambda.yml"
18:       - ".github/workflows/cd-seed.yml"
19:   workflow_dispatch:
20:     inputs:
21:       seed:
22:         description: "Seed the production database with initial data"
23:         type: boolean
24:         default: false
25: 
26: permissions:
27:   id-token: write   # Required by all child workflows for OIDC → AWS
28:   contents: read
29: 
30: concurrency:
31:   group: cd-deploy-${{ github.ref }}
32:   cancel-in-progress: true
33: 
34: env:
35:   AWS_REGION: ${{ vars.AWS_REGION || 'us-east-1' }}
36: 
37: jobs:
38:   # ── 1. Infrastructure ──────────────────────────────────────────
39:   infra:
40:     uses: ./.github/workflows/cd-infra.yml
41:     with:
42:       aws-region: ${{ vars.AWS_REGION || 'us-east-1' }}
43:     secrets:
44:       AWS_DEPLOY_ROLE_ARN: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
45:       PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
46: 
47:   # ── 2. Frontend (runs in parallel with backend & lambda) ───────
48:   frontend:
49:     uses: ./.github/workflows/cd-frontend.yml
50:     with:
51:       aws-region: ${{ vars.AWS_REGION || 'us-east-1' }}
52:     secrets:
53:       AWS_DEPLOY_ROLE_ARN: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
54: 
55:   # ── 3. Backend (needs infra outputs) ───────────────────────────
56:   backend:
57:     needs: infra
58:     uses: ./.github/workflows/cd-backend.yml
59:     with:
60:       aws-region:        ${{ vars.AWS_REGION || 'us-east-1' }}
61:       ecr-url:           ${{ needs.infra.outputs.ecr-url }}
62:       eb-app-name:       ${{ needs.infra.outputs.eb-app-name }}
63:       eb-env-name:       ${{ needs.infra.outputs.eb-env-name }}
64:       artifacts-bucket:  ${{ needs.infra.outputs.artifacts-bucket }}
65:     secrets:
66:       AWS_DEPLOY_ROLE_ARN: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
67: 
68:   # ── 4. Lambda functions (needs infra outputs) ──────────────────
69:   lambda:
70:     needs: infra
71:     uses: ./.github/workflows/cd-lambda.yml
72:     with:
73:       aws-region:                ${{ vars.AWS_REGION || 'us-east-1' }}
74:       lambda-function-name:      ${{ needs.infra.outputs.lambda-function-name }}
75:       reminder-lambda-name:      ${{ needs.infra.outputs.reminder-lambda-name }}
76:       notifications-lambda-name: ${{ needs.infra.outputs.notifications-lambda-name }}
77:     secrets:
78:       AWS_DEPLOY_ROLE_ARN: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
79: 
80:   # ── 5. Database seed (manual trigger only, after backend) ──────
81:   seed:
82:     needs: [infra, backend]
83:     if: ${{ github.event.inputs.seed == 'true' }}
84:     uses: ./.github/workflows/cd-seed.yml
85:     with:
86:       aws-region:  ${{ vars.AWS_REGION || 'us-east-1' }}
87:       eb-env-name: ${{ needs.infra.outputs.eb-env-name }}
88:     secrets:
89:       AWS_DEPLOY_ROLE_ARN: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}

(End of file - total 89 lines)
</content>
```

---

## Assistant (Plan · Kimi K2.5 · 5.6s)

_Thinking:_

Let me continue reading the remaining workflow files and other important infrastructure-related files to get a complete picture.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-backend.yml"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-backend.yml</path>
<type>file</type>
<content>
1: name: CD — Backend
2: 
3: on:
4:   workflow_call:
5:     inputs:
6:       aws-region:
7:         required: true
8:         type: string
9:       ecr-url:
10:         required: true
11:         type: string
12:       eb-app-name:
13:         required: true
14:         type: string
15:       eb-env-name:
16:         required: true
17:         type: string
18:       artifacts-bucket:
19:         required: true
20:         type: string
21:     secrets:
22:       AWS_DEPLOY_ROLE_ARN:
23:         required: true
24: 
25: jobs:
26:   deploy-backend:
27:     name: Backend — Publish, Push to ECR & Deploy to EB
28:     runs-on: ubuntu-latest
29:     permissions:
30:       id-token: write
31:       contents: read
32:     steps:
33:       - name: Checkout
34:         uses: actions/checkout@v4
35: 
36:       - name: Configure AWS credentials (OIDC)
37:         uses: aws-actions/configure-aws-credentials@v4
38:         with:
39:           role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
40:           aws-region: ${{ inputs.aws-region }}
41: 
42:       # ── Build Docker image (Dockerfile runs `dotnet publish` internally) ──
43:       - name: Log in to Amazon ECR
44:         id: ecr-login
45:         uses: aws-actions/amazon-ecr-login@v2
46: 
47:       - name: Build, tag & push image to ECR
48:         id: build-image
49:         env:
50:           ECR_REPOSITORY_URL: ${{ inputs.ecr-url }}
51:         run: |
52:           SHORT_SHA="${GITHUB_SHA:0:8}"
53:           VERSION_LABEL="telehealth-${{ github.run_number }}-${{ github.run_attempt }}-${SHORT_SHA}"
54:           IMAGE_URI="${ECR_REPOSITORY_URL}:${SHORT_SHA}"
55: 
56:           # Build from repo root so the Dockerfile can COPY backend/** correctly.
57:           # The multi-stage Dockerfile handles `dotnet restore` + `dotnet publish`
58:           # so no separate SDK setup is needed in CI.
59:           docker build \
60:             --file backend/src/TeleHealth.Api/Dockerfile \
61:             --build-arg BUILD_CONFIGURATION=Release \
62:             --tag "$IMAGE_URI" \
63:             --tag "${ECR_REPOSITORY_URL}:latest" \
64:             .
65: 
66:           docker push "$IMAGE_URI"
67:           docker push "${ECR_REPOSITORY_URL}:latest"
68: 
69:           # Pass image URI and version label to subsequent steps
70:           echo "image_uri=$IMAGE_URI" >> "$GITHUB_OUTPUT"
71:           echo "version_label=$VERSION_LABEL" >> "$GITHUB_OUTPUT"
72: 
73:       # ── Create a Dockerrun.aws.json that points EB at the ECR image ──
74:       - name: Create Dockerrun.aws.json
75:         env:
76:           IMAGE_URI: ${{ steps.build-image.outputs.image_uri }}
77:         run: |
78:           cat > Dockerrun.aws.json <<EOF
79:           {
80:             "AWSEBDockerrunVersion": "1",
81:             "Image": {
82:               "Name": "$IMAGE_URI",
83:               "Update": "true"
84:             },
85:             "Ports": [
86:               { "ContainerPort": 8080, "HostPort": 80 }
87:             ],
88:             "Logging": "/var/log/app-logs"
89:           }
90:           EOF
91: 
92:       # ── Upload artifact to S3, create EB version, trigger deployment ──
93:       - name: Deploy to Elastic Beanstalk
94:         env:
95:           VERSION_LABEL:    ${{ steps.build-image.outputs.version_label }}
96:           EB_APP_NAME:      ${{ inputs.eb-app-name }}
97:           EB_ENV_NAME:      ${{ inputs.eb-env-name }}
98:           ARTIFACTS_BUCKET: ${{ inputs.artifacts-bucket }}
99:         run: |
100:           S3_KEY="eb-deployments/Dockerrun-${VERSION_LABEL}.json"
101: 
102:           # Upload the deployment manifest to the artifacts bucket
103:           aws s3 cp Dockerrun.aws.json "s3://${ARTIFACTS_BUCKET}/${S3_KEY}"
104: 
105:           # Register a new application version in EB
106:           aws elasticbeanstalk create-application-version \
107:             --application-name "$EB_APP_NAME" \
108:             --version-label "$VERSION_LABEL" \
109:             --source-bundle S3Bucket="$ARTIFACTS_BUCKET",S3Key="$S3_KEY" \
110:             --description "SHA ${{ github.sha }} — run #${{ github.run_number }}"
111: 
112:           # Trigger the environment update
113:           aws elasticbeanstalk update-environment \
114:             --environment-name "$EB_ENV_NAME" \
115:             --version-label "$VERSION_LABEL"
116: 
117:           echo "Waiting for environment update to complete..."
118: 
119:           # Poll EB until the environment is back to Ready (up to 10 min)
120:           aws elasticbeanstalk wait environment-updated \
121:             --environment-names "$EB_ENV_NAME"
122: 
123:           echo "Deployment complete."
124:           echo "API URL: $(aws elasticbeanstalk describe-environments \
125:             --environment-names "$EB_ENV_NAME" \
126:             --query 'Environments[0].CNAME' \
127:             --output text)"

(End of file - total 127 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-frontend.yml"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-frontend.yml</path>
<type>file</type>
<content>
1: name: CD — Frontend
2: 
3: on:
4:   workflow_call:
5:     inputs:
6:       aws-region:
7:         required: true
8:         type: string
9:     secrets:
10:       AWS_DEPLOY_ROLE_ARN:
11:         required: true
12: 
13: jobs:
14:   deploy-frontend:
15:     name: Frontend — Build & Sync to S3
16:     runs-on: ubuntu-latest
17:     permissions:
18:       id-token: write
19:       contents: read
20:     steps:
21:       - name: Checkout
22:         uses: actions/checkout@v4
23: 
24:       - name: Configure AWS credentials (OIDC)
25:         uses: aws-actions/configure-aws-credentials@v4
26:         with:
27:           role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
28:           aws-region: ${{ inputs.aws-region }}
29: 
30:       - name: Setup Bun
31:         uses: oven-sh/setup-bun@v2
32:         with:
33:           bun-version: latest
34: 
35:       - name: Cache Bun dependencies
36:         uses: actions/cache@v4
37:         with:
38:           path: ~/.bun/install/cache
39:           key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lock') }}
40:           restore-keys: ${{ runner.os }}-bun-
41: 
42:       - name: Resolve API URL
43:         run: |
44:           echo "VITE_API_URL=https://api.telehealth.foo" >> "$GITHUB_ENV"
45: 
46:       - name: Install & Build
47:         working-directory: frontend
48:         run: |
49:           bun install --frozen-lockfile
50:           bun run build
51: 
52:       # Upload hashed assets with a long cache TTL;
53:       # upload index.html with no-cache so browsers always fetch the latest entry point.
54:       - name: Sync to S3
55:         env:
56:           BUCKET: www.telehealth.foo
57:         run: |
58:           # Hashed JS/CSS/images — immutable, cache 1 year
59:           aws s3 sync frontend/dist s3://$BUCKET \
60:             --delete \
61:             --exclude "*.html" \
62:             --cache-control "public, max-age=31536000, immutable"
63: 
64:           # HTML files — always revalidate
65:           aws s3 sync frontend/dist s3://$BUCKET \
66:             --exclude "*" \
67:             --include "*.html" \
68:             --cache-control "no-cache, no-store, must-revalidate"

(End of file - total 68 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-lambda.yml"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-lambda.yml</path>
<type>file</type>
<content>
1: name: CD — Lambda Functions
2: 
3: on:
4:   workflow_call:
5:     inputs:
6:       aws-region:
7:         required: true
8:         type: string
9:       lambda-function-name:
10:         required: true
11:         type: string
12:       reminder-lambda-name:
13:         required: true
14:         type: string
15:       notifications-lambda-name:
16:         required: true
17:         type: string
18:     secrets:
19:       AWS_DEPLOY_ROLE_ARN:
20:         required: true
21: 
22: jobs:
23:   deploy-lambda:
24:     name: Lambda — Build Native AOT & Deploy
25:     runs-on: ubuntu-latest
26:     permissions:
27:       id-token: write
28:       contents: read
29:     steps:
30:       - name: Checkout
31:         uses: actions/checkout@v4
32: 
33:       - name: Configure AWS credentials (OIDC)
34:         uses: aws-actions/configure-aws-credentials@v4
35:         with:
36:           role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
37:           aws-region: ${{ inputs.aws-region }}
38: 
39:       - name: Setup .NET
40:         uses: actions/setup-dotnet@v4
41:         with:
42:           dotnet-version: "10.0.x"
43: 
44:       # ── Build the Lambda function using Native AOT for Amazon Linux 2023 ──
45:       - name: Publish Lambda (Native AOT)
46:         working-directory: functions/lab-pdf-processor/src/LabPdfProcessor-dev-ProcessPdfDocument
47:         run: |
48:           # Publish for Linux ARM64 (Graviton) or x64 depending on your preference.
49:           # Assuming x64 here to match standard Lambda provided.al2023
50:           dotnet publish -c Release -r linux-x64 --self-contained true -o ./publish
51: 
52:           # Zip the output (The Native AOT binary is named 'bootstrap')
53:           cd publish
54:           zip -r ../../../function.zip *
55: 
56:       # ── Update the Lambda function code directly via AWS CLI ──
57:       - name: Deploy to AWS Lambda
58:         env:
59:           LAMBDA_NAME: ${{ inputs.lambda-function-name }}
60:         run: |
61:           aws lambda update-function-code \
62:             --function-name "$LAMBDA_NAME" \
63:             --zip-file fileb://functions/lab-pdf-processor/function.zip
64: 
65:           echo "✅ Lab PDF processor Lambda deployment complete."
66: 
67:       - name: Publish appointment-reminder Lambda
68:         working-directory: functions/appointment-reminder/src/AppointmentReminder-dev-SentReminder
69:         run: |
70:           dotnet publish -c Release -r linux-x64 --self-contained true -o ./publish
71:           cd publish && zip -r ../../../function.zip *
72: 
73:       - name: Deploy appointment-reminder to AWS Lambda
74:         env:
75:           LAMBDA_NAME: ${{ inputs.reminder-lambda-name }}
76:         run: |
77:           aws lambda update-function-code \
78:             --function-name "$LAMBDA_NAME" \
79:             --zip-file fileb://functions/appointment-reminder/function.zip
80: 
81:           echo "✅ Appointment reminder Lambda deployment complete."
82: 
83:       - name: Publish appointment-notifications Lambda
84:         working-directory: functions/appointment-notifications/src/AppointmentNotifications
85:         run: |
86:           dotnet publish -c Release -r linux-x64 --self-contained true -o ./publish
87:           cd publish && zip -r ../../../function.zip *
88: 
89:       - name: Deploy appointment-notifications to AWS Lambda
90:         env:
91:           LAMBDA_NAME: ${{ inputs.notifications-lambda-name }}
92:         run: |
93:           aws lambda update-function-code \
94:             --function-name "$LAMBDA_NAME" \
95:             --zip-file fileb://functions/appointment-notifications/function.zip
96: 
97:           echo "✅ Appointment notifications Lambda deployment complete."

(End of file - total 97 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-seed.yml"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/.github/workflows/cd-seed.yml</path>
<type>file</type>
<content>
1: name: CD — Database Seed
2: 
3: # Injects Seed__EnableOnStartup=true as an EB environment variable,
4: # waits for the environment to stabilise, then removes the variable
5: # so subsequent restarts don't re-seed.
6: #
7: # The seeder is idempotent — it skips if db.Users.Any() is true,
8: # so accidental re-runs are safe.
9: 
10: on:
11:   workflow_call:
12:     inputs:
13:       aws-region:
14:         required: true
15:         type: string
16:       eb-env-name:
17:         required: true
18:         type: string
19:     secrets:
20:       AWS_DEPLOY_ROLE_ARN:
21:         required: true
22: 
23: jobs:
24:   seed-database:
25:     name: Database — Apply Seed Data
26:     runs-on: ubuntu-latest
27:     permissions:
28:       id-token: write
29:       contents: read
30:     steps:
31:       - name: Configure AWS credentials (OIDC)
32:         uses: aws-actions/configure-aws-credentials@v4
33:         with:
34:           role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
35:           aws-region: ${{ inputs.aws-region }}
36: 
37:       - name: Snapshot RDS before seeding
38:         env:
39:           DB_INSTANCE: telehealth-dbfe5a2f2
40:         run: |
41:           SNAPSHOT_ID="pre-seed-$(date +%Y%m%d-%H%M%S)"
42:           echo "Creating RDS snapshot: $SNAPSHOT_ID"
43:           aws rds create-db-snapshot \
44:             --db-instance-identifier "$DB_INSTANCE" \
45:             --db-snapshot-identifier "$SNAPSHOT_ID"
46:           aws rds wait db-snapshot-available \
47:             --db-snapshot-identifier "$SNAPSHOT_ID"
48:           echo "Snapshot $SNAPSHOT_ID is available."
49: 
50:       - name: Enable seeding via EB environment variable
51:         env:
52:           EB_ENV_NAME: ${{ inputs.eb-env-name }}
53:         run: |
54:           # Resolve the EB environment name from the input; fall back to
55:           # a describe call if the input is empty.
56:           if [ -z "$EB_ENV_NAME" ]; then
57:             EB_ENV_NAME=$(aws elasticbeanstalk describe-environments \
58:               --query "Environments[?Status=='Ready']|[0].EnvironmentName" \
59:               --output text)
60:           fi
61:           echo "EB_ENV_NAME=$EB_ENV_NAME" >> "$GITHUB_ENV"
62: 
63:           echo "Injecting Seed__EnableOnStartup=true into $EB_ENV_NAME"
64:           aws elasticbeanstalk update-environment \
65:             --environment-name "$EB_ENV_NAME" \
66:             --option-settings \
67:               "Namespace=aws:elasticbeanstalk:application:environment,OptionName=Seed__EnableOnStartup,Value=true"
68: 
69:           echo "Waiting for environment to be Ready..."
70:           aws elasticbeanstalk wait environment-updated \
71:             --environment-names "$EB_ENV_NAME"
72:           echo "Environment is Ready — seeder has executed on startup."
73: 
74:       - name: Remove seed flag from EB environment
75:         run: |
76:           echo "Removing Seed__EnableOnStartup from $EB_ENV_NAME"
77:           aws elasticbeanstalk update-environment \
78:             --environment-name "$EB_ENV_NAME" \
79:             --option-settings \
80:               "Namespace=aws:elasticbeanstalk:application:environment,OptionName=Seed__EnableOnStartup,Value=false"
81: 
82:           echo "Waiting for environment to stabilise..."
83:           aws elasticbeanstalk wait environment-updated \
84:             --environment-names "$EB_ENV_NAME"
85:           echo "Seed flag removed. Database seeding complete."

(End of file - total 85 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Config.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Config.cs</path>
<type>file</type>
<content>
1: namespace TeleHealth.Infra;
2: 
3: using Pulumi;
4: 
5: /// <summary>
6: /// Centralized configuration for the TeleHealth infrastructure stack.
7: /// All config keys, defaults, and shared tags are defined here so that
8: /// domain files never read Config directly.
9: /// </summary>
10: public sealed class StackConfig
11: {
12:     // Database
13:     public Output<string> DbPassword { get; }
14:     public string DbInstanceClass { get; }
15:     public string DbName { get; }
16:     public string DbUsername { get; }
17: 
18:     // JWT authentication
19:     public Output<string> JwtSecret { get; }
20: 
21:     // AWS
22:     public string AwsRegion { get; }
23: 
24:     /// <summary>
25:     /// Allowed CORS origin for the lab reports S3 bucket.
26:     /// Defaults to "*" (any origin) for dev convenience.
27:     /// Set per-stack: pulumi config set telehealth:frontendOrigin https://telehealth.example.com
28:     /// </summary>
29:     public string FrontendOrigin { get; }
30: 
31:     // Stack metadata
32:     public string StackName { get; }
33:     public InputMap<string> Tags { get; }
34: 
35:     /// <summary>
36:     /// Whether to skip the final DB snapshot on deletion.
37:     /// Defaults to true for "dev" stacks, false for all others (staging/prod
38:     /// always get a final snapshot unless explicitly overridden via config).
39:     /// Override with: pulumi config set telehealth:skipFinalSnapshot true
40:     /// </summary>
41:     public bool SkipFinalSnapshot { get; }
42: 
43:     public StackConfig()
44:     {
45:         var config = new Config("telehealth");
46:         DbPassword = config.RequireSecret("dbPassword");
47:         DbInstanceClass = config.Get("dbInstanceClass") ?? "db.t3.micro";
48:         DbName = config.Get("dbName") ?? "telehealth_dev";
49:         DbUsername = config.Get("dbUsername") ?? "telehealth_admin";
50:         JwtSecret = config.RequireSecret("jwtSecret");
51:         FrontendOrigin = config.Get("frontendOrigin") ?? "*";
52: 
53:         var awsConfig = new Config("aws");
54:         AwsRegion = awsConfig.Get("region") ?? "us-east-1";
55: 
56:         StackName = Deployment.Instance.StackName;
57: 
58:         // Dev stacks skip final snapshot by default; prod/staging do not
59:         var skipOverride = config.GetBoolean("skipFinalSnapshot");
60:         SkipFinalSnapshot =
61:             skipOverride ?? StackName.Equals("dev", StringComparison.OrdinalIgnoreCase);
62: 
63:         Tags = new InputMap<string>
64:         {
65:             { "Project", "TeleHealth-DDAC" },
66:             { "ManagedBy", "Pulumi" },
67:             { "Environment", StackName },
68:         };
69:     }
70: }

(End of file - total 70 lines)
</content>
```

---

## Assistant (Plan · Kimi K2.5 · 4.2s)

_Thinking:_

Now let me read more infrastructure files to get a complete picture of how data migration and other workflows work.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Networking.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Networking.cs</path>
<type>file</type>
<content>
1: namespace TeleHealth.Infra;
2: 
3: using System.Collections.Immutable;
4: using Pulumi;
5: using Aws = Pulumi.Aws;
6: 
7: /// <summary>
8: /// VPC lookups and security groups for the TeleHealth stack.
9: /// Uses the default VPC but locks down DB access to EB instances only.
10: /// </summary>
11: public static class Networking
12: {
13:     private static readonly string[] AvailabilityZones =
14:     [
15:         "us-east-1a",
16:         "us-east-1b",
17:         "us-east-1c",
18:         "us-east-1d",
19:         "us-east-1f",
20:     ];
21: 
22:     public sealed class Result
23:     {
24:         public required Output<string> VpcId { get; init; }
25:         public required Output<ImmutableArray<string>> SubnetIds { get; init; }
26:         public required Aws.Ec2.SecurityGroup EbSecurityGroup { get; init; }
27:         public required Aws.Ec2.SecurityGroup DbSecurityGroup { get; init; }
28:         public required Aws.Rds.SubnetGroup DbSubnetGroup { get; init; }
29:     }
30: 
31:     public static Result Create(StackConfig cfg)
32:     {
33:         var defaultVpc = Aws.Ec2.GetVpc.Invoke(new Aws.Ec2.GetVpcInvokeArgs { Default = true });
34: 
35:         var defaultSubnets = Aws.Ec2.GetSubnets.Invoke(
36:             new Aws.Ec2.GetSubnetsInvokeArgs
37:             {
38:                 Filters = new[]
39:                 {
40:                     new Aws.Ec2.Inputs.GetSubnetsFilterInputArgs
41:                     {
42:                         Name = "vpc-id",
43:                         Values = new[] { defaultVpc.Apply(v => v.Id) },
44:                     },
45:                     new Aws.Ec2.Inputs.GetSubnetsFilterInputArgs
46:                     {
47:                         Name = "availability-zone",
48:                         Values = AvailabilityZones,
49:                     },
50:                 },
51:             }
52:         );
53: 
54:         // Elastic Beanstalk instances — HTTP/HTTPS from the internet
55:         var ebSecurityGroup = new Aws.Ec2.SecurityGroup(
56:             "eb-sg",
57:             new Aws.Ec2.SecurityGroupArgs
58:             {
59:                 Description = "TeleHealth API - Elastic Beanstalk instances",
60:                 VpcId = defaultVpc.Apply(v => v.Id),
61:                 Ingress = new[]
62:                 {
63:                     new Aws.Ec2.Inputs.SecurityGroupIngressArgs
64:                     {
65:                         Protocol = "tcp",
66:                         FromPort = 80,
67:                         ToPort = 80,
68:                         CidrBlocks = { "0.0.0.0/0" },
69:                         Description = "HTTP from load balancer / internet",
70:                     },
71:                     new Aws.Ec2.Inputs.SecurityGroupIngressArgs
72:                     {
73:                         Protocol = "tcp",
74:                         FromPort = 443,
75:                         ToPort = 443,
76:                         CidrBlocks = { "0.0.0.0/0" },
77:                         Description = "HTTPS from load balancer / internet",
78:                     },
79:                 },
80:                 Egress = new[]
81:                 {
82:                     new Aws.Ec2.Inputs.SecurityGroupEgressArgs
83:                     {
84:                         Protocol = "-1",
85:                         FromPort = 0,
86:                         ToPort = 0,
87:                         CidrBlocks = { "0.0.0.0/0" },
88:                         Description = "Allow all outbound",
89:                     },
90:                 },
91:                 Tags = cfg.Tags,
92:             }
93:         );
94: 
95:         // RDS — port 5432 only from the EB security group, NOT the internet
96:         var dbSecurityGroup = new Aws.Ec2.SecurityGroup(
97:             "db-sg",
98:             new Aws.Ec2.SecurityGroupArgs
99:             {
100:                 Description = "TeleHealth RDS - PostgreSQL accessible from EB only",
101:                 VpcId = defaultVpc.Apply(v => v.Id),
102:                 Ingress = new[]
103:                 {
104:                     new Aws.Ec2.Inputs.SecurityGroupIngressArgs
105:                     {
106:                         Protocol = "tcp",
107:                         FromPort = 5432,
108:                         ToPort = 5432,
109:                         SecurityGroups = { ebSecurityGroup.Id },
110:                         Description = "PostgreSQL from Elastic Beanstalk instances only",
111:                     },
112:                 },
113:                 Egress = new[]
114:                 {
115:                     new Aws.Ec2.Inputs.SecurityGroupEgressArgs
116:                     {
117:                         Protocol = "-1",
118:                         FromPort = 0,
119:                         ToPort = 0,
120:                         CidrBlocks = { "0.0.0.0/0" },
121:                     },
122:                 },
123:                 Tags = cfg.Tags,
124:             }
125:         );
126: 
127:         var dbSubnetGroup = new Aws.Rds.SubnetGroup(
128:             "telehealth-db-subnet-group",
129:             new Aws.Rds.SubnetGroupArgs
130:             {
131:                 SubnetIds = defaultSubnets.Apply(s => s.Ids),
132:                 Tags = cfg.Tags,
133:             }
134:         );
135: 
136:         return new Result
137:         {
138:             VpcId = defaultVpc.Apply(v => v.Id),
139:             SubnetIds = defaultSubnets.Apply(s => s.Ids),
140:             EbSecurityGroup = ebSecurityGroup,
141:             DbSecurityGroup = dbSecurityGroup,
142:             DbSubnetGroup = dbSubnetGroup,
143:         };
144:     }
145: }

(End of file - total 145 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Serverless.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Serverless.cs</path>
<type>file</type>
<content>
1: namespace TeleHealth.Infra;
2: 
3: using Pulumi;
4: using Aws = Pulumi.Aws;
5: 
6: /// <summary>
7: /// Lambda function for processing lab report PDFs.
8: /// Triggered by SQS messages from the lab-report processing queue.
9: ///
10: /// Fixes applied:
11: ///   - Runtime: dotnet10 (managed .NET 10 runtime, GA since Jan 2026)
12: ///   - Scoped S3 read permission for lab reports bucket
13: ///   - ReservedConcurrentExecutions to prevent overwhelming RDS
14: ///   - Dummy zip placeholder for initial Pulumi creation (CI/CD overwrites)
15: /// </summary>
16: public static class Serverless
17: {
18:     public sealed class Result
19:     {
20:         public required Aws.Lambda.Function PdfProcessorLambda { get; init; }
21:         public required Aws.Lambda.Function ReminderLambda { get; init; }
22:         public required Aws.Lambda.Function NotificationsLambda { get; init; }
23:     }
24: 
25:     public static Result Create(StackConfig cfg, Messaging.Result msg, Storage.Result storage)
26:     {
27:         // ── IAM role for Lambda ──
28:         var lambdaRole = new Aws.Iam.Role(
29:             "lambda-pdf-processor-role",
30:             new Aws.Iam.RoleArgs
31:             {
32:                 AssumeRolePolicy =
33:                     @"{
34:                     ""Version"": ""2012-10-17"",
35:                     ""Statement"": [{
36:                         ""Action"": ""sts:AssumeRole"",
37:                         ""Principal"": { ""Service"": ""lambda.amazonaws.com"" },
38:                         ""Effect"": ""Allow""
39:                     }]
40:                 }",
41:                 Tags = cfg.Tags,
42:             }
43:         );
44: 
45:         // Managed policies: basic execution (CloudWatch Logs) + SQS polling
46:         _ = new Aws.Iam.RolePolicyAttachment(
47:             "lambda-basic-execution",
48:             new Aws.Iam.RolePolicyAttachmentArgs
49:             {
50:                 Role = lambdaRole.Name,
51:                 PolicyArn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
52:             }
53:         );
54: 
55:         _ = new Aws.Iam.RolePolicyAttachment(
56:             "lambda-sqs-execution",
57:             new Aws.Iam.RolePolicyAttachmentArgs
58:             {
59:                 Role = lambdaRole.Name,
60:                 PolicyArn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole",
61:             }
62:         );
63: 
64:         // Scoped inline policy: S3 read access for lab reports bucket only
65:         _ = new Aws.Iam.RolePolicy(
66:             "lambda-s3-lab-reports",
67:             new Aws.Iam.RolePolicyArgs
68:             {
69:                 Role = lambdaRole.Name,
70:                 Policy = storage.LabReportsBucket.Arn.Apply(arn =>
71:                     $@"{{
72:                         ""Version"": ""2012-10-17"",
73:                         ""Statement"": [{{
74:                             ""Effect"": ""Allow"",
75:                             ""Action"": [""s3:GetObject""],
76:                             ""Resource"": ""{arn}/*""
77:                         }}]
78:                     }}"
79:                 ),
80:             }
81:         );
82: 
83:         // ── Lambda function ──
84:         var pdfProcessorLambda = new Aws.Lambda.Function(
85:             "lab-pdf-processor",
86:             new Aws.Lambda.FunctionArgs
87:             {
88:                 Name = $"telehealth-lab-pdf-processor-{cfg.StackName}",
89:                 Role = lambdaRole.Arn,
90:                 Runtime = "dotnet10",
91:                 Handler =
92:                     "LabPdfProcessor-dev-ProcessPdfDocument::LabPdfProcessor_dev_ProcessPdfDocument.Function::FunctionHandler",
93:                 MemorySize = 256,
94:                 Timeout = 30,
95: 
96:                 // Removed ReservedConcurrentExecutions — account lacks headroom.
97:                 // Use RDS Proxy or connection pooling to protect the database instead.
98:                 // ReservedConcurrentExecutions = 5,
99: 
100:                 // Dummy deployment package — CI/CD overwrites with the real build.
101:                 // This file must exist for Pulumi to create the Lambda resource.
102:                 Code = new FileArchive("./dummy-lambda"),
103: 
104:                 Environment = new Aws.Lambda.Inputs.FunctionEnvironmentArgs
105:                 {
106:                     Variables = new InputMap<string>
107:                     {
108:                         { "ENVIRONMENT", cfg.StackName },
109:                         { "S3_LAB_REPORTS_BUCKET", storage.LabReportsBucket.BucketName },
110:                     },
111:                 },
112:                 Tags = cfg.Tags,
113:             },
114:             // Ignore code changes — CI/CD (Job 4) deploys the real artifact via
115:             // `aws lambda update-function-code`. Without this, every `pulumi up`
116:             // would revert the deployed code back to the dummy placeholder.
117:             new CustomResourceOptions { IgnoreChanges = { "sourceCodeHash" } }
118:         );
119: 
120:         // ── SQS event source mapping (triggers Lambda from the processing queue) ──
121:         // ReportBatchItemFailures enables partial batch reporting: only failed
122:         // messages are retried, not the entire batch. Requires the Lambda handler
123:         // to return SQSBatchResponse with failed message IDs.
124:         _ = new Aws.Lambda.EventSourceMapping(
125:             "sqs-to-lambda-mapping",
126:             new Aws.Lambda.EventSourceMappingArgs
127:             {
128:                 EventSourceArn = msg.ProcessingQueue.Arn,
129:                 FunctionName = pdfProcessorLambda.Arn,
130:                 BatchSize = 10,
131:                 Enabled = true,
132:                 FunctionResponseTypes = { "ReportBatchItemFailures" },
133:             },
134:             new CustomResourceOptions
135:             {
136:                 DependsOn = { pdfProcessorLambda },
137:                 DeleteBeforeReplace = true,
138:             }
139:         );
140: 
141:         // ── IAM role for Appointment Reminder Lambda ──
142:         var reminderRole = new Aws.Iam.Role(
143:             "lambda-reminder-role",
144:             new Aws.Iam.RoleArgs
145:             {
146:                 AssumeRolePolicy =
147:                     @"{
148:                     ""Version"": ""2012-10-17"",
149:                     ""Statement"": [{
150:                         ""Action"": ""sts:AssumeRole"",
151:                         ""Principal"": { ""Service"": ""lambda.amazonaws.com"" },
152:                         ""Effect"": ""Allow""
153:                     }]
154:                 }",
155:                 Tags = cfg.Tags,
156:             }
157:         );
158: 
159:         _ = new Aws.Iam.RolePolicyAttachment(
160:             "reminder-basic-execution",
161:             new Aws.Iam.RolePolicyAttachmentArgs
162:             {
163:                 Role = reminderRole.Name,
164:                 PolicyArn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
165:             }
166:         );
167: 
168:         // Scoped SES send permission
169:         _ = new Aws.Iam.RolePolicy(
170:             "reminder-ses-send",
171:             new Aws.Iam.RolePolicyArgs
172:             {
173:                 Role = reminderRole.Name,
174:                 Policy =
175:                     @"{
176:                         ""Version"": ""2012-10-17"",
177:                         ""Statement"": [{
178:                             ""Effect"": ""Allow"",
179:                             ""Action"": [""ses:SendEmail"", ""ses:SendRawEmail""],
180:                             ""Resource"": ""*""
181:                         }]
182:                     }",
183:             }
184:         );
185: 
186:         // ── Appointment Reminder Lambda (triggered directly by SNS) ──
187:         var reminderLambda = new Aws.Lambda.Function(
188:             "appointment-reminder",
189:             new Aws.Lambda.FunctionArgs
190:             {
191:                 Name = $"telehealth-appointment-reminder-{cfg.StackName}",
192:                 Role = reminderRole.Arn,
193:                 Runtime = "dotnet10",
194:                 Handler =
195:                     "AppointmentReminder-dev-SentReminder::AppointmentReminder_dev_SentReminder.Function::FunctionHandler",
196:                 MemorySize = 256,
197:                 Timeout = 60,
198:                 Code = new FileArchive("./dummy-lambda"),
199:                 Environment = new Aws.Lambda.Inputs.FunctionEnvironmentArgs
200:                 {
201:                     Variables = new InputMap<string>
202:                     {
203:                         { "ENVIRONMENT", cfg.StackName },
204:                         { "SES_SENDER_EMAIL", "hongjx0321@gmail.com" },
205:                         { "SES_REGION", "us-east-1" },
206:                     },
207:                 },
208:                 Tags = cfg.Tags,
209:             },
210:             new CustomResourceOptions { IgnoreChanges = { "sourceCodeHash" } }
211:         );
212: 
213:         // Allow SNS to invoke the Lambda directly
214:         _ = new Aws.Lambda.Permission(
215:             "reminder-sns-invoke",
216:             new Aws.Lambda.PermissionArgs
217:             {
218:                 Action = "lambda:InvokeFunction",
219:                 Function = reminderLambda.Arn,
220:                 Principal = "sns.amazonaws.com",
221:                 SourceArn = msg.AppointmentBookedTopic.Arn,
222:             }
223:         );
224: 
225:         // Subscribe Lambda directly to the AppointmentBookedEvent SNS topic
226:         _ = new Aws.Sns.TopicSubscription(
227:             "reminder-sns-sub",
228:             new Aws.Sns.TopicSubscriptionArgs
229:             {
230:                 Topic = msg.AppointmentBookedTopic.Arn,
231:                 Protocol = "lambda",
232:                 Endpoint = reminderLambda.Arn,
233:             }
234:         );
235: 
236:         // ── IAM role for Appointment Notifications Lambda ──
237:         var notificationsRole = new Aws.Iam.Role(
238:             "lambda-notifications-role",
239:             new Aws.Iam.RoleArgs
240:             {
241:                 AssumeRolePolicy =
242:                     @"{
243:                     ""Version"": ""2012-10-17"",
244:                     ""Statement"": [{
245:                         ""Action"": ""sts:AssumeRole"",
246:                         ""Principal"": { ""Service"": ""lambda.amazonaws.com"" },
247:                         ""Effect"": ""Allow""
248:                     }]
249:                 }",
250:                 Tags = cfg.Tags,
251:             }
252:         );
253: 
254:         _ = new Aws.Iam.RolePolicyAttachment(
255:             "notifications-basic-execution",
256:             new Aws.Iam.RolePolicyAttachmentArgs
257:             {
258:                 Role = notificationsRole.Name,
259:                 PolicyArn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
260:             }
261:         );
262: 
263:         _ = new Aws.Iam.RolePolicy(
264:             "notifications-ses-send",
265:             new Aws.Iam.RolePolicyArgs
266:             {
267:                 Role = notificationsRole.Name,
268:                 Policy =
269:                     @"{
270:                         ""Version"": ""2012-10-17"",
271:                         ""Statement"": [{
272:                             ""Effect"": ""Allow"",
273:                             ""Action"": [""ses:SendEmail"", ""ses:SendRawEmail""],
274:                             ""Resource"": ""*""
275:                         }]
276:                     }",
277:             }
278:         );
279: 
280:         // ── Appointment Notifications Lambda (cancelled + rescheduled) ──
281:         var notificationsLambda = new Aws.Lambda.Function(
282:             "appointment-notifications",
283:             new Aws.Lambda.FunctionArgs
284:             {
285:                 Name = $"telehealth-appointment-notifications-{cfg.StackName}",
286:                 Role = notificationsRole.Arn,
287:                 Runtime = "dotnet10",
288:                 Handler =
289:                     "AppointmentNotifications::AppointmentNotifications.Function::FunctionHandler",
290:                 MemorySize = 256,
291:                 Timeout = 60,
292:                 Code = new FileArchive("./dummy-lambda"),
293:                 Environment = new Aws.Lambda.Inputs.FunctionEnvironmentArgs
294:                 {
295:                     Variables = new InputMap<string>
296:                     {
297:                         { "ENVIRONMENT", cfg.StackName },
298:                         { "SES_SENDER_EMAIL", "hongjx0321@gmail.com" },
299:                         { "SES_REGION", "us-east-1" },
300:                     },
301:                 },
302:                 Tags = cfg.Tags,
303:             },
304:             new CustomResourceOptions { IgnoreChanges = { "sourceCodeHash" } }
305:         );
306: 
307:         _ = new Aws.Lambda.Permission(
308:             "notifications-cancelled-sns-invoke",
309:             new Aws.Lambda.PermissionArgs
310:             {
311:                 Action = "lambda:InvokeFunction",
312:                 Function = notificationsLambda.Arn,
313:                 Principal = "sns.amazonaws.com",
314:                 SourceArn = msg.AppointmentCancelledTopic.Arn,
315:             }
316:         );
317: 
318:         _ = new Aws.Lambda.Permission(
319:             "notifications-rescheduled-sns-invoke",
320:             new Aws.Lambda.PermissionArgs
321:             {
322:                 Action = "lambda:InvokeFunction",
323:                 Function = notificationsLambda.Arn,
324:                 Principal = "sns.amazonaws.com",
325:                 SourceArn = msg.AppointmentRescheduledTopic.Arn,
326:             }
327:         );
328: 
329:         _ = new Aws.Sns.TopicSubscription(
330:             "notifications-cancelled-sns-sub",
331:             new Aws.Sns.TopicSubscriptionArgs
332:             {
333:                 Topic = msg.AppointmentCancelledTopic.Arn,
334:                 Protocol = "lambda",
335:                 Endpoint = notificationsLambda.Arn,
336:             }
337:         );
338: 
339:         _ = new Aws.Sns.TopicSubscription(
340:             "notifications-rescheduled-sns-sub",
341:             new Aws.Sns.TopicSubscriptionArgs
342:             {
343:                 Topic = msg.AppointmentRescheduledTopic.Arn,
344:                 Protocol = "lambda",
345:                 Endpoint = notificationsLambda.Arn,
346:             }
347:         );
348: 
349:         return new Result
350:         {
351:             PdfProcessorLambda = pdfProcessorLambda,
352:             ReminderLambda = reminderLambda,
353:             NotificationsLambda = notificationsLambda,
354:         };
355:     }
356: }

(End of file - total 356 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Storage.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Storage.cs</path>
<type>file</type>
<content>
1: namespace TeleHealth.Infra;
2: 
3: using Pulumi;
4: using Aws = Pulumi.Aws;
5: 
6: /// <summary>
7: /// S3 buckets for the TeleHealth stack:
8: ///   - Frontend static website (public, ForceDestroy for easy teardown)
9: ///   - EB deployment artifacts (ephemeral)
10: ///   - Lab reports (private, protected — contains patient medical data)
11: /// </summary>
12: public static class Storage
13: {
14:     public sealed class Result
15:     {
16:         public required Aws.S3.Bucket FrontendBucket { get; init; }
17:         public required Aws.S3.BucketWebsiteConfiguration FrontendWebsiteConfig { get; init; }
18:         public required Aws.S3.Bucket ArtifactsBucket { get; init; }
19:         public required Aws.S3.Bucket LabReportsBucket { get; init; }
20:     }
21: 
22:     public static Result Create(StackConfig cfg)
23:     {
24:         // ── Frontend — S3 static website for TanStack Router SPA ──
25:         var frontendBucket = new Aws.S3.Bucket(
26:             "telehealth-frontend",
27:             new Aws.S3.BucketArgs { ForceDestroy = true, Tags = cfg.Tags }
28:         );
29: 
30:         var frontendWebsiteConfig = new Aws.S3.BucketWebsiteConfiguration(
31:             "frontend-website-config",
32:             new Aws.S3.BucketWebsiteConfigurationArgs
33:             {
34:                 Bucket = frontendBucket.Id,
35:                 IndexDocument = new Aws.S3.Inputs.BucketWebsiteConfigurationIndexDocumentArgs
36:                 {
37:                     Suffix = "index.html",
38:                 },
39:                 ErrorDocument = new Aws.S3.Inputs.BucketWebsiteConfigurationErrorDocumentArgs
40:                 {
41:                     Key = "index.html", // Required for TanStack Router SPA
42:                 },
43:             }
44:         );
45: 
46:         var frontendPublicAccessBlock = new Aws.S3.BucketPublicAccessBlock(
47:             "frontend-pab",
48:             new Aws.S3.BucketPublicAccessBlockArgs
49:             {
50:                 Bucket = frontendBucket.Id,
51:                 BlockPublicAcls = false,
52:                 BlockPublicPolicy = false,
53:                 IgnorePublicAcls = false,
54:                 RestrictPublicBuckets = false,
55:             }
56:         );
57: 
58:         _ = new Aws.S3.BucketPolicy(
59:             "frontend-policy",
60:             new Aws.S3.BucketPolicyArgs
61:             {
62:                 Bucket = frontendBucket.Id,
63:                 Policy = frontendBucket.Arn.Apply(arn =>
64:                     $@"{{
65:                         ""Version"": ""2012-10-17"",
66:                         ""Statement"": [{{
67:                             ""Effect"": ""Allow"",
68:                             ""Principal"": ""*"",
69:                             ""Action"": [""s3:GetObject""],
70:                             ""Resource"": [""{arn}/*""]
71:                         }}]
72:                     }}"
73:                 ),
74:             },
75:             new CustomResourceOptions { DependsOn = frontendPublicAccessBlock }
76:         );
77: 
78:         // ── EB deployment artifacts (Dockerrun.aws.json) ──
79:         var artifactsBucket = new Aws.S3.Bucket(
80:             "telehealth-eb-artifacts",
81:             new Aws.S3.BucketArgs { ForceDestroy = true, Tags = cfg.Tags }
82:         );
83: 
84:         // ── Lab reports — private, protected, patient medical data ──
85:         var labReportsBucket = new Aws.S3.Bucket(
86:             "telehealth-lab-reports",
87:             new Aws.S3.BucketArgs { Tags = cfg.Tags },
88:             new CustomResourceOptions { Protect = true }
89:         );
90: 
91:         _ = new Aws.S3.BucketCorsConfiguration(
92:             "labReportsCors",
93:             new Aws.S3.BucketCorsConfigurationArgs
94:             {
95:                 Bucket = labReportsBucket.Id,
96:                 CorsRules = new[]
97:                 {
98:                     new Aws.S3.Inputs.BucketCorsConfigurationCorsRuleArgs
99:                     {
100:                         AllowedHeaders = { "*" },
101:                         AllowedMethods = { "PUT", "POST", "GET" },
102:                         AllowedOrigins = { cfg.FrontendOrigin },
103:                         MaxAgeSeconds = 3000,
104:                     },
105:                 },
106:             }
107:         );
108: 
109:         // Block ALL public access — lab reports contain sensitive patient data
110:         _ = new Aws.S3.BucketPublicAccessBlock(
111:             "lab-reports-pab",
112:             new Aws.S3.BucketPublicAccessBlockArgs
113:             {
114:                 Bucket = labReportsBucket.Id,
115:                 BlockPublicAcls = true,
116:                 BlockPublicPolicy = true,
117:                 IgnorePublicAcls = true,
118:                 RestrictPublicBuckets = true,
119:             }
120:         );
121: 
122:         return new Result
123:         {
124:             FrontendBucket = frontendBucket,
125:             FrontendWebsiteConfig = frontendWebsiteConfig,
126:             ArtifactsBucket = artifactsBucket,
127:             LabReportsBucket = labReportsBucket,
128:         };
129:     }
130: }

(End of file - total 130 lines)
</content>
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/backend/**/appsettings*.json"
}
```

**Output:**
```
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/appsettings.json
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/appsettings.Development.json
```

---

## Assistant (Plan · Kimi K2.5 · 4.6s)

_Thinking:_

Let me also look at the backend Dockerfile and seed-related code to understand data migration better.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/appsettings.json"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/appsettings.json</path>
<type>file</type>
<content>
1: {
2:   "Logging": {
3:     "LogLevel": {
4:       "Default": "Information",
5:       "Microsoft.AspNetCore": "Warning"
6:     }
7:   },
8:   "Serilog": {
9:     "Using": ["Serilog.Sinks.Console"],
10:     "MinimumLevel": {
11:       "Default": "Warning",
12:       "Override": {
13:         "Microsoft": "Warning",
14:         "System": "Warning"
15:       }
16:     },
17:     "WriteTo": [
18:       {
19:         "Name": "Console",
20:         "Args": {
21:           "outputTemplate": "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}"
22:         }
23:       },
24:       {
25:         "Name": "Seq",
26:         "Args": {
27:           "serverUrl": "http://telehealth_seq:5341"
28:         }
29:       },
30:       {
31:         "Name": "OpenTelemetry",
32:         "Args": {
33:           "endpoint": "http://telehealth_seq:5341/ingest/otlp/v1/logs",
34:           "protocol": "HttpProtobuf",
35:           "headers": {
36:             "X-Seq-ApiKey": "DOjvrcXB9RfyEGDwyKX2"
37:           },
38:           "resourceAttributes": {
39:             "service.name": "TeleHealth.Api"
40:           }
41:         }
42:       }
43:     ],
44:     "Enrich": ["FromLogContext", "WithMachineName", "WithThreadId"]
45:   },
46:   "Cors": {
47:     "AllowedOrigins": ["http://localhost:5173"]
48:   },
49:   "Jwt": {
50:     "Secret": "",
51:     "Issuer": "telehealth-api",
52:     "Audience": "telehealth-web",
53:     "ExpiryMinutes": 60
54:   },
55:   "Aws": {
56:     "Region": "us-east-1",
57:     "S3": {
58:       "BucketName": "Telehealth-LabReports"
59:     },
60:     "Sns": {
61:       "NotificationsTopicArn": ""
62:     },
63:     "Sqs": {
64:       "LabProcessorQueueUrl": "",
65:       "EmailQueueUrl": ""
66:     }
67:   },
68:   "Frontend": {
69:     "BaseUrl": "http://localhost:5173"
70:   },
71:   "AllowedHosts": "*"
72: }

(End of file - total 72 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Dockerfile"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Dockerfile</path>
<type>file</type>
<content>
1: FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS base
2: RUN apk add --no-cache krb5-libs
3: WORKDIR /app
4:  
5: EXPOSE 8080
6: EXPOSE 8081
7:  
8: FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
9:  
10: ARG BUILD_CONFIGURATION=Release
11: WORKDIR /src
12:  
13: COPY [".editorconfig", "./"]
14: COPY [".csharpierignore", "./"]
15: COPY ["Directory.Build.props", "./"]
16: COPY ["Directory.Packages.props", "./"]
17: COPY ["backend/src/TeleHealth.Contracts/TeleHealth.Contracts.csproj", "./TeleHealth.Contracts/"]
18: COPY ["backend/src/TeleHealth.Api/TeleHealth.Api.csproj", "./TeleHealth.Api/"]
19: RUN dotnet restore "./TeleHealth.Api/TeleHealth.Api.csproj"
20:  
21: COPY backend/src/TeleHealth.Api/ ./TeleHealth.Api/
22: COPY backend/src/TeleHealth.Contracts/ ./TeleHealth.Contracts/  
23: WORKDIR "/src/TeleHealth.Api"
24: RUN dotnet build "TeleHealth.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build
25:  
26: FROM build AS publish
27: ARG BUILD_CONFIGURATION=Release
28: RUN dotnet publish "TeleHealth.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false
29:  
30: FROM base AS final
31: WORKDIR /app
32:  
33: USER $APP_UID
34:  
35: COPY --from=publish /app/publish .
36: ENTRYPOINT ["dotnet", "TeleHealth.Api.dll"]

(End of file - total 36 lines)
</content>
```

**Tool: grep**

**Input:**
```json
{
  "pattern": "Seed|Migration|seeder|migrate",
  "include": "*.cs"
}
```

**Output:**
```
Found 204 matches (showing first 100)
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/ApplicationDbContextModelSnapshot.cs:
  Line 14: namespace TeleHealth.Api.Migrations


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260428173708_AddSystemSettings.cs:
  Line 1: using Microsoft.EntityFrameworkCore.Migrations;

  Line 5: namespace TeleHealth.Api.Migrations

  Line 8:     public partial class AddSystemSettings : Migration

  Line 11:         protected override void Up(MigrationBuilder migrationBuilder)

  Line 79:         protected override void Down(MigrationBuilder migrationBuilder)


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260428173708_AddSystemSettings.Designer.cs:
  Line 7: using Microsoft.EntityFrameworkCore.Migrations;

  Line 15: namespace TeleHealth.Api.Migrations

  Line 18:     [Migration("20260428173708_AddSystemSettings")]


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260426045222_AddDepartmentSoftDelete.Designer.cs:
  Line 7: using Microsoft.EntityFrameworkCore.Migrations;

  Line 15: namespace TeleHealth.Api.Migrations

  Line 18:     [Migration("20260426045222_AddDepartmentSoftDelete")]


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260426045222_AddDepartmentSoftDelete.cs:
  Line 1: using Microsoft.EntityFrameworkCore.Migrations;

  Line 4: namespace TeleHealth.Api.Migrations

  Line 7:     public partial class AddDepartmentSoftDelete : Migration

  Line 10:         protected override void Up(MigrationBuilder migrationBuilder)

  Line 18:         protected override void Down(MigrationBuilder migrationBuilder)


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260425025758_MassTransitDowngradeAgain.cs:
  Line 1: using Microsoft.EntityFrameworkCore.Migrations;

  Line 5: namespace TeleHealth.Api.Migrations

  Line 8:     public partial class MassTransitDowngradeAgain : Migration

  Line 11:         protected override void Up(MigrationBuilder migrationBuilder)

  Line 23:         protected override void Down(MigrationBuilder migrationBuilder)


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260425025339_SomethingMigrated.cs:
  Line 1: using Microsoft.EntityFrameworkCore.Migrations;

  Line 5: namespace TeleHealth.Api.Migrations

  Line 8:     public partial class SomethingMigrated : Migration

  Line 11:         protected override void Up(MigrationBuilder migrationBuilder)

  Line 27:         protected override void Down(MigrationBuilder migrationBuilder)


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260425025758_MassTransitDowngradeAgain.Designer.cs:
  Line 7: using Microsoft.EntityFrameworkCore.Migrations;

  Line 15: namespace TeleHealth.Api.Migrations

  Line 18:     [Migration("20260425025758_MassTransitDowngradeAgain")]


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260419091419_FixAddressJsonPropertyNames.Designer.cs:
  Line 7: using Microsoft.EntityFrameworkCore.Migrations;

  Line 15: namespace TeleHealth.Api.Migrations

  Line 18:     [Migration("20260419091419_FixAddressJsonPropertyNames")]


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260409080000_AddDoctorScheduleRowVersion2.cs:
  Line 1: using Microsoft.EntityFrameworkCore.Migrations;

  Line 5: namespace TeleHealth.Api.Migrations

  Line 8:     public partial class AddDoctorScheduleRowVersion2 : Migration

  Line 11:         protected override void Up(MigrationBuilder migrationBuilder)

  Line 19:         protected override void Down(MigrationBuilder migrationBuilder)


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260425025339_SomethingMigrated.Designer.cs:
  Line 7: using Microsoft.EntityFrameworkCore.Migrations;

  Line 15: namespace TeleHealth.Api.Migrations

  Line 18:     [Migration("20260425025339_SomethingMigrated")]


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260409080000_AddDoctorScheduleRowVersion2.Designer.cs:
  Line 7: using Microsoft.EntityFrameworkCore.Migrations;

  Line 15: namespace TeleHealth.Api.Migrations

  Line 18:     [Migration("20260409080000_AddDoctorScheduleRowVersion2")]


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260419091419_FixAddressJsonPropertyNames.cs:
  Line 1: using Microsoft.EntityFrameworkCore.Migrations;

  Line 5: namespace TeleHealth.Api.Migrations

  Line 8:     public partial class FixAddressJsonPropertyNames : Migration

  Line 11:         protected override void Up(MigrationBuilder migrationBuilder)

  Line 18:         protected override void Down(MigrationBuilder migrationBuilder)


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260401034342_Outbox2.cs:
  Line 1: using Microsoft.EntityFrameworkCore.Migrations;

  Line 5: namespace TeleHealth.Api.Migrations

  Line 8:     public partial class Outbox2 : Migration

  Line 11:         protected override void Up(MigrationBuilder migrationBuilder)

  Line 23:         protected override void Down(MigrationBuilder migrationBuilder)


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260409074129_AddDoctorScheduleRowVersion.cs:
  Line 1: using Microsoft.EntityFrameworkCore.Migrations;

  Line 5: namespace TeleHealth.Api.Migrations

  Line 8:     public partial class AddDoctorScheduleRowVersion : Migration

  Line 11:         protected override void Up(MigrationBuilder migrationBuilder)

  Line 22:         protected override void Down(MigrationBuilder migrationBuilder)


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260401034342_Outbox2.Designer.cs:
  Line 7: using Microsoft.EntityFrameworkCore.Migrations;

  Line 15: namespace TeleHealth.Api.Migrations

  Line 18:     [Migration("20260401034342_Outbox2")]


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260409074129_AddDoctorScheduleRowVersion.Designer.cs:
  Line 7: using Microsoft.EntityFrameworkCore.Migrations;

  Line 15: namespace TeleHealth.Api.Migrations

  Line 18:     [Migration("20260409074129_AddDoctorScheduleRowVersion")]


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260327083205_FixedAuditLogsPublicIdIssue.cs:
  Line 1: using Microsoft.EntityFrameworkCore.Migrations;

  Line 5: namespace TeleHealth.Api.Migrations

  Line 8:     public partial class FixedAuditLogsPublicIdIssue : Migration

  Line 14:         protected override void Up(MigrationBuilder migrationBuilder)

  Line 100:         protected override void Down(MigrationBuilder migrationBuilder)


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260327083205_FixedAuditLogsPublicIdIssue.Designer.cs:
  Line 7: using Microsoft.EntityFrameworkCore.Migrations;

  Line 15: namespace TeleHealth.Api.Migrations

  Line 18:     [Migration("20260327083205_FixedAuditLogsPublicIdIssue")]


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260401022550_Outbox.Designer.cs:
  Line 7: using Microsoft.EntityFrameworkCore.Migrations;

  Line 15: namespace TeleHealth.Api.Migrations

  Line 18:     [Migration("20260401022550_Outbox")]


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260401022550_Outbox.cs:
  Line 3: using Microsoft.EntityFrameworkCore.Migrations;

  Line 9: namespace TeleHealth.Api.Migrations

  Line 12:     public partial class Outbox : Migration

  Line 15:         protected override void Up(MigrationBuilder migrationBuilder)

  Line 138:         protected override void Down(MigrationBuilder migrationBuilder)


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260327074951_UpdatedAuditLogsTriggers.Designer.cs:
  Line 7: using Microsoft.EntityFrameworkCore.Migrations;

  Line 15: namespace TeleHealth.Api.Migrations

  Line 18:     [Migration("20260327074951_UpdatedAuditLogsTriggers")]


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260327082051_FixedAuditLogTriggersIssue.cs:
  Line 1: using Microsoft.EntityFrameworkCore.Migrations;

  Line 5: namespace TeleHealth.Api.Migrations

  Line 8:     public partial class FixedAuditLogTriggersIssue : Migration

  Line 14:         protected override void Up(MigrationBuilder migrationBuilder)

  Line 98:         protected override void Down(MigrationBuilder migrationBuilder)


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260327074951_UpdatedAuditLogsTriggers.cs:
  Line 4: using Microsoft.EntityFrameworkCore.Migrations;

  Line 8: namespace TeleHealth.Api.Migrations

  Line 11:     public partial class UpdatedAuditLogsTriggers : Migration

  Line 14:         protected override void Up(MigrationBuilder migrationBuilder)

  Line 33:         protected override void Down(MigrationBuilder migrationBuilder)


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260327082051_FixedAuditLogTriggersIssue.Designer.cs:
  Line 7: using Microsoft.EntityFrameworkCore.Migrations;

  Line 15: namespace TeleHealth.Api.Migrations

  Line 18:     [Migration("20260327082051_FixedAuditLogTriggersIssue")]


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/20260326065528_UpdatedRecordSchemas.cs:
  Line 1: using Microsoft.EntityFrameworkCore.Migrations;

  Line 5: namespace TeleHealth.Api.Migrations

  Line 8:     public partial class UpdatedRecordSchemas : Migration


(Results truncated: showing 100 of 204 matches (104 hidden). Consider using a more specific path or pattern.)
```

---

## Assistant (Plan · Kimi K2.5 · 3.7s)

_Thinking:_

Let me look for the seeder class and data migration patterns.

**Tool: grep**

**Input:**
```json
{
  "pattern": "DataSeeder|Seeder|Seed.*Data|SeedExtension",
  "include": "*.cs"
}
```

**Output:**
```
Found 4 matches
/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Infrastructure/Persistence/Seeding/DatabaseSeeder.cs:
  Line 12: public sealed class DatabaseSeeder(


/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Common/Extensions/DatabaseExtensions.cs:
  Line 15:         services.AddScoped<DatabaseSeeder>();

  Line 36:                                 var seeder = serviceProvider.GetRequiredService<DatabaseSeeder>();

  Line 46:                                 var seeder = serviceProvider.GetRequiredService<DatabaseSeeder>();

```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations</path>
<type>directory</type>
<entries>
20260322094251_InitialIdentitySetup.cs
20260322094251_InitialIdentitySetup.Designer.cs
20260322113019_UserRoleUpdatedWithCreatedAt.cs
20260322113019_UserRoleUpdatedWithCreatedAt.Designer.cs
20260323102730_LookupAndIdentityProfileTable.cs
20260323102730_LookupAndIdentityProfileTable.Designer.cs
20260324032736_ClinicOperationsSetupTable.cs
20260324032736_ClinicOperationsSetupTable.Designer.cs
20260325021757_SystemAuditsTables.cs
20260325021757_SystemAuditsTables.Designer.cs
20260325022523_AddDatabaseTriggers.cs
20260325022523_AddDatabaseTriggers.Designer.cs
20260325023750_AddAuditLogsTriggers.cs
20260325023750_AddAuditLogsTriggers.Designer.cs
20260326065528_UpdatedRecordSchemas.cs
20260326065528_UpdatedRecordSchemas.Designer.cs
20260327074951_UpdatedAuditLogsTriggers.cs
20260327074951_UpdatedAuditLogsTriggers.Designer.cs
20260327082051_FixedAuditLogTriggersIssue.cs
20260327082051_FixedAuditLogTriggersIssue.Designer.cs
20260327083205_FixedAuditLogsPublicIdIssue.cs
20260327083205_FixedAuditLogsPublicIdIssue.Designer.cs
20260401022550_Outbox.cs
20260401022550_Outbox.Designer.cs
20260401034342_Outbox2.cs
20260401034342_Outbox2.Designer.cs
20260409074129_AddDoctorScheduleRowVersion.cs
20260409074129_AddDoctorScheduleRowVersion.Designer.cs
20260409080000_AddDoctorScheduleRowVersion2.cs
20260409080000_AddDoctorScheduleRowVersion2.Designer.cs
20260419091419_FixAddressJsonPropertyNames.cs
20260419091419_FixAddressJsonPropertyNames.Designer.cs
20260425025339_SomethingMigrated.cs
20260425025339_SomethingMigrated.Designer.cs
20260425025758_MassTransitDowngradeAgain.cs
20260425025758_MassTransitDowngradeAgain.Designer.cs
20260426045222_AddDepartmentSoftDelete.cs
20260426045222_AddDepartmentSoftDelete.Designer.cs
20260428173708_AddSystemSettings.cs
20260428173708_AddSystemSettings.Designer.cs
ApplicationDbContextModelSnapshot.cs

(41 entries)
</entries>
```

---

## Assistant (Plan · Kimi K2.5 · 6.0s)

_Thinking:_

Let me read the database seeder and extensions to understand how seeding works.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Infrastructure/Persistence/Seeding/DatabaseSeeder.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Infrastructure/Persistence/Seeding/DatabaseSeeder.cs</path>
<type>file</type>
<content>
1: using Microsoft.AspNetCore.Identity;
2: using Microsoft.EntityFrameworkCore;
3: using NodaTime;
4: using Serilog;
5: using Slugify;
6: using TeleHealth.Api.Domain.Entities;
7: using TeleHealth.Api.Infrastructure.Persistence.Seeding.Fakers;
8: 
9: namespace TeleHealth.Api.Infrastructure.Persistence.Seeding;
10: 
11: /// Registered as a scoped service and invoked via EF Core's UseAsyncSeeding hook.
12: public sealed class DatabaseSeeder(
13:     IPasswordHasher<User> passwordHasher,
14:     IConfiguration configuration
15: )
16: {
17:     private readonly SlugHelper _slugHelper = new();
18: 
19:     public async Task SeedAsync(ApplicationDbContext db, CancellationToken ct = default)
20:     {
21:         var truncateOnStartup = configuration.GetValue<bool>("Seed:TruncateOnStartup");
22:         if (truncateOnStartup)
23:         {
24:             Log.Warning("Seed:TruncateOnStartup is enabled — truncating all tables...");
25:             await db.Database.ExecuteSqlRawAsync(
26:                 """
27:                 TRUNCATE TABLE
28:                     lab_reports,
29:                     prescriptions,
30:                     consultations,
31:                     appointments,
32:                     doctor_schedules,
33:                     user_roles,
34:                     doctors,
35:                     patients,
36:                     users,
37:                     system_operating_hours,
38:                     system_settings
39:                 RESTART IDENTITY CASCADE
40:                 """,
41:                 ct
42:             );
43:             db.ChangeTracker.Clear();
44:             Log.Warning("Truncation complete. Proceeding with seeding.");
45:         }
46:         else if (await db.Users.AnyAsync(ct))
47:         {
48:             Log.Information("Database already contains data. Skipping seeding.");
49:             return;
50:         }
51: 
52:         // Phase 0: System settings + operating hours (static clinic config)
53:         var systemSettings = SystemSettingFaker.BuildSystemSettings();
54:         db.SystemSettings.AddRange(systemSettings);
55:         await db.SaveChangesAsync(ct);
56: 
57:         Log.Information("Seeding database with Bogus fake data...");
58: 
59:         var defaultPassword = configuration["Seed:DefaultPassword"] ?? "Password123!";
60:         var faker = SeedFakers.CreateFaker();
61: 
62:         var roles = await db.Roles.ToDictionaryAsync(r => r.Slug, ct);
63:         var departments = await db.Departments.ToDictionaryAsync(d => d.Slug, ct);
64:         var scheduleStatuses = await db.ScheduleStatuses.ToDictionaryAsync(s => s.Slug, ct);
65:         var appointmentStatuses = await db.AppointmentStatuses.ToDictionaryAsync(s => s.Slug, ct);
66:         var labReportStatuses = await db.LabReportStatuses.ToDictionaryAsync(s => s.Slug, ct);
67: 
68:         // Phase 1: Build all users
69:         var adminUsers = AdminFaker.BuildAdminUsers(
70:             faker,
71:             passwordHasher,
72:             defaultPassword,
73:             _slugHelper
74:         );
75:         var receptionistUsers = ReceptionistFaker.BuildReceptionistUsers(
76:             faker,
77:             passwordHasher,
78:             defaultPassword,
79:             _slugHelper
80:         );
81:         var labTechUsers = LabTechFaker.BuildLabTechUsers(
82:             faker,
83:             passwordHasher,
84:             defaultPassword,
85:             _slugHelper
86:         );
87: 
88:         var doctorData = DoctorFaker.BuildDoctorUsers(
89:             faker,
90:             passwordHasher,
91:             defaultPassword,
92:             departments,
93:             _slugHelper
94:         );
95:         var patientData = PatientFaker.BuildPatientUsers(
96:             faker,
97:             passwordHasher,
98:             defaultPassword,
99:             _slugHelper
100:         );
101: 
102:         db.Users.AddRange(adminUsers);
103:         db.Users.AddRange(receptionistUsers);
104:         db.Users.AddRange(labTechUsers);
105:         db.Users.AddRange(doctorData.Select(d => d.User));
106:         db.Users.AddRange(patientData.Select(p => p.User));
107:         await db.SaveChangesAsync(ct);
108: 
109:         // Phase 2: Profiles + UserRoles (FKs resolved after Phase 1)
110:         db.UserRoles.AddRange(
111:             adminUsers.Select(u => new UserRole { UserId = u.Id, RoleId = roles["admin"].Id })
112:         );
113:         db.UserRoles.AddRange(
114:             receptionistUsers.Select(u => new UserRole
115:             {
116:                 UserId = u.Id,
117:                 RoleId = roles["receptionist"].Id,
118:             })
119:         );
120:         db.UserRoles.AddRange(
121:             labTechUsers.Select(u => new UserRole { UserId = u.Id, RoleId = roles["lab-tech"].Id })
122:         );
123:         db.UserRoles.AddRange(
124:             doctorData.Select(d => new UserRole { UserId = d.User.Id, RoleId = roles["doctor"].Id })
125:         );
126:         db.UserRoles.AddRange(
127:             patientData.Select(p => new UserRole
128:             {
129:                 UserId = p.User.Id,
130:                 RoleId = roles["patient"].Id,
131:             })
132:         );
133: 
134:         foreach (var (user, doctor) in doctorData)
135:         {
136:             doctor.UserId = user.Id;
137:             db.Doctors.Add(doctor);
138:         }
139: 
140:         foreach (var (user, patient) in patientData)
141:         {
142:             patient.UserId = user.Id;
143:             db.Patients.Add(patient);
144:         }
145: 
146:         await db.SaveChangesAsync(ct);
147: 
148:         // Phase 3: Schedules
149:         var today = SystemClock.Instance.GetCurrentInstant().InUtc().Date;
150:         var doctors = doctorData.Select(d => d.Doctor).ToList();
151: 
152:         var schedules = ScheduleFaker.BuildDoctorSchedules(
153:             doctors,
154:             today,
155:             availableStatusId: scheduleStatuses["available"].Id
156:         );
157:         db.DoctorSchedules.AddRange(schedules);
158:         await db.SaveChangesAsync(ct);
159:         db.ChangeTracker.Clear();
160: 
161:         // Phase 4: Appointments
162:         var patients = patientData.Select(p => p.Patient).ToList();
163: 
164:         var bookedScheduleStatusId = scheduleStatuses["booked"].Id;
165: 
166:         var (appointments, touchedScheduleIds) = AppointmentFaker.BuildAppointments(
167:             faker,
168:             doctors,
169:             patients,
170:             schedules,
171:             doctorData[0].User,
172:             appointmentStatuses
173:         );
174: 
175:         await db
176:             .DoctorSchedules.Where(s => touchedScheduleIds.Contains(s.Id))
177:             .ExecuteUpdateAsync(s => s.SetProperty(x => x.StatusId, bookedScheduleStatusId), ct);
178: 
179:         db.Appointments.AddRange(appointments);
180:         await db.SaveChangesAsync(ct);
181: 
182:         // Phase 5: Consultations
183:         var consultations = ConsultationFaker.BuildConsultations(faker, appointments, _slugHelper);
184:         db.Consultations.AddRange(consultations);
185:         await db.SaveChangesAsync(ct);
186: 
187:         // Phase 6: Prescriptions
188:         var prescriptions = PrescriptionFaker.BuildPrescriptions(faker, consultations);
189:         db.Prescriptions.AddRange(prescriptions);
190:         await db.SaveChangesAsync(ct);
191: 
192:         // Phase 7: Lab Reports
193:         var labReports = LabReportFaker.BuildLabReports(
194:             faker,
195:             consultations,
196:             appointments,
197:             patients,
198:             labReportStatuses,
199:             _slugHelper
200:         );
201:         db.LabReports.AddRange(labReports);
202:         await db.SaveChangesAsync(ct);
203: 
204:         Log.Information(
205:             "Seeding complete: {SystemSettings} system settings, {Admins} admins, "
206:                 + "{Receptionists} receptionists, {LabTechs} lab techs, "
207:                 + "{Doctors} doctors, {Patients} patients, {Schedules} schedules, "
208:                 + "{Appointments} appointments, {Consultations} consultations, "
209:                 + "{Prescriptions} prescriptions, {LabReports} lab reports",
210:             systemSettings.Count,
211:             adminUsers.Count,
212:             receptionistUsers.Count,
213:             labTechUsers.Count,
214:             doctors.Count,
215:             patients.Count,
216:             schedules.Count,
217:             appointments.Count,
218:             consultations.Count,
219:             prescriptions.Count,
220:             labReports.Count
221:         );
222:     }
223: }

(End of file - total 223 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Common/Extensions/DatabaseExtensions.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Common/Extensions/DatabaseExtensions.cs</path>
<type>file</type>
<content>
1: using Microsoft.EntityFrameworkCore;
2: using TeleHealth.Api.Infrastructure.Persistence;
3: using TeleHealth.Api.Infrastructure.Persistence.Seeding;
4: 
5: namespace TeleHealth.Api.Common.Extensions;
6: 
7: public static class DatabaseExtensions
8: {
9:     public static IServiceCollection AddDatabaseConfiguration(
10:         this IServiceCollection services,
11:         IConfiguration configuration,
12:         IWebHostEnvironment environment
13:     )
14:     {
15:         services.AddScoped<DatabaseSeeder>();
16: 
17:         services.AddDbContext<ApplicationDbContext>(
18:             (serviceProvider, options) =>
19:             {
20:                 options
21:                     .UseNpgsql(
22:                         configuration.GetConnectionString("Database"),
23:                         o => o.SetPostgresVersion(18, 0).UseNodaTime()
24:                     )
25:                     .UseSnakeCaseNamingConvention();
26: 
27:                 if (
28:                     environment.IsDevelopment()
29:                     || configuration.GetValue<bool>("Seed:EnableOnStartup")
30:                 )
31:                 {
32:                     options
33:                         .UseSeeding(
34:                             (ctx, _) =>
35:                             {
36:                                 var seeder = serviceProvider.GetRequiredService<DatabaseSeeder>();
37:                                 seeder
38:                                     .SeedAsync((ApplicationDbContext)ctx)
39:                                     .GetAwaiter()
40:                                     .GetResult();
41:                             }
42:                         )
43:                         .UseAsyncSeeding(
44:                             async (ctx, _, ct) =>
45:                             {
46:                                 var seeder = serviceProvider.GetRequiredService<DatabaseSeeder>();
47:                                 await seeder.SeedAsync((ApplicationDbContext)ctx, ct);
48:                             }
49:                         );
50:                 }
51:             }
52:         );
53: 
54:         return services;
55:     }
56: 
57:     public static async Task MigrateAsync(this WebApplication app)
58:     {
59:         using var scope = app.Services.CreateScope();
60:         var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
61:         await dbContext.Database.MigrateAsync();
62:     }
63: }

(End of file - total 63 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Messaging.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Messaging.cs</path>
<type>file</type>
<content>
1: namespace TeleHealth.Infra;
2: 
3: using Pulumi;
4: using Aws = Pulumi.Aws;
5: 
6: /// <summary>
7: /// SNS topic and SQS queue for the lab-report processing pipeline.
8: /// SNS fans out medical alerts; SQS buffers reports for async processing.
9: /// A dead-letter queue captures messages that fail processing after 3 attempts.
10: /// </summary>
11: public static class Messaging
12: {
13:     public sealed class Result
14:     {
15:         public required Aws.Sns.Topic MedicalAlertsTopic { get; init; }
16:         public required Aws.Sns.Topic AppointmentBookedTopic { get; init; }
17:         public required Aws.Sns.Topic OpsAlertsTopic { get; init; }
18:         public required Aws.Sns.Topic AppointmentCancelledTopic { get; init; }
19:         public required Aws.Sns.Topic AppointmentRescheduledTopic { get; init; }
20:         public required Aws.Sqs.Queue ProcessingQueue { get; init; }
21:         public required Aws.Sqs.Queue DeadLetterQueue { get; init; }
22:     }
23: 
24:     public static Result Create(StackConfig cfg)
25:     {
26:         var medicalAlertsTopic = new Aws.Sns.Topic(
27:             "medical-alerts-topic",
28:             new Aws.Sns.TopicArgs
29:             {
30:                 KmsMasterKeyId = "alias/aws/sns", // Server-side encryption with AWS-managed key
31:                 Tags = cfg.Tags,
32:             }
33:         );
34: 
35:         // Dead-letter queue — captures messages that fail processing after 3 attempts
36:         var deadLetterQueue = new Aws.Sqs.Queue(
37:             "report-processing-dlq",
38:             new Aws.Sqs.QueueArgs
39:             {
40:                 SqsManagedSseEnabled = true,
41:                 MessageRetentionSeconds = 1_209_600, // 14 days (max) to allow investigation
42:                 Tags = cfg.Tags,
43:             }
44:         );
45: 
46:         var processingQueue = new Aws.Sqs.Queue(
47:             "report-processing-queue",
48:             new Aws.Sqs.QueueArgs
49:             {
50:                 SqsManagedSseEnabled = true, // Server-side encryption with SQS-managed keys
51:                 VisibilityTimeoutSeconds = 360,
52:                 RedrivePolicy = deadLetterQueue.Arn.Apply(dlqArn =>
53:                     $@"{{""deadLetterTargetArn"":""{dlqArn}"",""maxReceiveCount"":3}}"
54:                 ),
55:                 Tags = cfg.Tags,
56:             },
57:             new CustomResourceOptions { DeleteBeforeReplace = true }
58:         );
59: 
60:         _ = new Aws.Sns.TopicSubscription(
61:             "queue-topic-sub",
62:             new Aws.Sns.TopicSubscriptionArgs
63:             {
64:                 Topic = medicalAlertsTopic.Arn,
65:                 Protocol = "sqs",
66:                 Endpoint = processingQueue.Arn,
67:             }
68:         );
69: 
70:         var appointmentBookedTopic = new Aws.Sns.Topic(
71:             "appointment-booked-topic",
72:             new Aws.Sns.TopicArgs { KmsMasterKeyId = "alias/aws/sns", Tags = cfg.Tags }
73:         );
74: 
75:         var opsAlertsTopic = new Aws.Sns.Topic(
76:             "ops-alerts-topic",
77:             new Aws.Sns.TopicArgs { KmsMasterKeyId = "alias/aws/sns", Tags = cfg.Tags }
78:         );
79: 
80:         var appointmentCancelledTopic = new Aws.Sns.Topic(
81:             "appointment-notifications-cancelled-topic",
82:             new Aws.Sns.TopicArgs { KmsMasterKeyId = "alias/aws/sns", Tags = cfg.Tags }
83:         );
84: 
85:         var appointmentRescheduledTopic = new Aws.Sns.Topic(
86:             "appointment-notifications-rescheduled-topic",
87:             new Aws.Sns.TopicArgs { KmsMasterKeyId = "alias/aws/sns", Tags = cfg.Tags }
88:         );
89: 
90:         _ = new Aws.Sqs.QueuePolicy(
91:             "queue-policy",
92:             new Aws.Sqs.QueuePolicyArgs
93:             {
94:                 QueueUrl = processingQueue.Id,
95:                 Policy = Output
96:                     .Tuple(processingQueue.Arn, medicalAlertsTopic.Arn)
97:                     .Apply(t =>
98:                         $@"{{
99:                             ""Version"": ""2012-10-17"",
100:                             ""Statement"": [{{
101:                                 ""Effect"": ""Allow"",
102:                                 ""Principal"": {{ ""Service"": ""sns.amazonaws.com"" }},
103:                                 ""Action"": ""sqs:SendMessage"",
104:                                 ""Resource"": ""{t.Item1}"",
105:                                 ""Condition"": {{ ""ArnEquals"": {{ ""aws:SourceArn"": ""{t.Item2}"" }} }}
106:                             }}]
107:                         }}"
108:                     ),
109:             }
110:         );
111: 
112:         return new Result
113:         {
114:             MedicalAlertsTopic = medicalAlertsTopic,
115:             AppointmentBookedTopic = appointmentBookedTopic,
116:             OpsAlertsTopic = opsAlertsTopic,
117:             AppointmentCancelledTopic = appointmentCancelledTopic,
118:             AppointmentRescheduledTopic = appointmentRescheduledTopic,
119:             ProcessingQueue = processingQueue,
120:             DeadLetterQueue = deadLetterQueue,
121:         };
122:     }
123: }

(End of file - total 123 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Observability.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Observability.cs</path>
<type>file</type>
<content>
1: namespace TeleHealth.Infra;
2: 
3: using Pulumi;
4: using Aws = Pulumi.Aws;
5: 
6: /// <summary>
7: /// CloudWatch log groups, metric alarms, and X-Ray tracing configuration.
8: /// Alarms route to the medical alerts SNS topic for unified notification.
9: /// </summary>
10: public static class Observability
11: {
12:     public sealed class Result
13:     {
14:         public required Aws.CloudWatch.LogGroup ApiLogGroup { get; init; }
15:         public required Aws.Xray.Group XrayGroup { get; init; }
16:     }
17: 
18:     public static Result Create(StackConfig cfg, Database.Result db, Messaging.Result msg)
19:     {
20:         // ── CloudWatch log groups ──
21:         var apiLogGroup = new Aws.CloudWatch.LogGroup(
22:             "telehealth-api-logs",
23:             new Aws.CloudWatch.LogGroupArgs
24:             {
25:                 Name = $"/telehealth/{cfg.StackName}/api",
26:                 RetentionInDays = 30,
27:                 Tags = cfg.Tags,
28:             }
29:         );
30: 
31:         // NOTE: RDS log groups (/aws/rds/instance/{id}/postgresql, /aws/rds/instance/{id}/upgrade)
32:         // are auto-created by AWS when EnabledCloudwatchLogsExports is set on the RDS instance.
33:         // Do not create them here — it would conflict with the AWS-managed groups.
34: 
35:         // ── Metric alarms — route to SNS ──
36: 
37:         // RDS CPU > 80% for 10 minutes
38:         _ = new Aws.CloudWatch.MetricAlarm(
39:             "rds-high-cpu",
40:             new Aws.CloudWatch.MetricAlarmArgs
41:             {
42:                 ComparisonOperator = "GreaterThanThreshold",
43:                 EvaluationPeriods = 2,
44:                 MetricName = "CPUUtilization",
45:                 Namespace = "AWS/RDS",
46:                 Period = 300,
47:                 Statistic = "Average",
48:                 Threshold = 80,
49:                 AlarmDescription = "RDS CPU > 80% for 10 minutes",
50:                 Dimensions = new InputMap<string> { { "DBInstanceIdentifier", db.Instance.Id } },
51:                 AlarmActions = { msg.OpsAlertsTopic.Arn },
52:                 OkActions = { msg.OpsAlertsTopic.Arn },
53:                 Tags = cfg.Tags,
54:             }
55:         );
56: 
57:         // RDS free storage < 2 GiB
58:         _ = new Aws.CloudWatch.MetricAlarm(
59:             "rds-low-storage",
60:             new Aws.CloudWatch.MetricAlarmArgs
61:             {
62:                 ComparisonOperator = "LessThanThreshold",
63:                 EvaluationPeriods = 1,
64:                 MetricName = "FreeStorageSpace",
65:                 Namespace = "AWS/RDS",
66:                 Period = 300,
67:                 Statistic = "Average",
68:                 Threshold = 2_147_483_648, // 2 GiB in bytes
69:                 AlarmDescription = "RDS free storage below 2 GiB",
70:                 Dimensions = new InputMap<string> { { "DBInstanceIdentifier", db.Instance.Id } },
71:                 AlarmActions = { msg.OpsAlertsTopic.Arn },
72:                 OkActions = { msg.OpsAlertsTopic.Arn },
73:                 Tags = cfg.Tags,
74:             }
75:         );
76: 
77:         // ── X-Ray — tracing group + sampling rule ──
78:         _ = new Aws.Xray.SamplingRule(
79:             "telehealth-sampling-rule",
80:             new Aws.Xray.SamplingRuleArgs
81:             {
82:                 RuleName = "telehealth-api-sampling",
83:                 Priority = 9000,
84:                 ReservoirSize = 5, // Always sample 5 req/s regardless of fixed rate
85:                 FixedRate = 0.10, // Sample 10% of remaining requests
86:                 UrlPath = "/api/*",
87:                 Host = "*",
88:                 HttpMethod = "*",
89:                 ServiceName = "telehealth-api",
90:                 ServiceType = "*",
91:                 ResourceArn = "*",
92:                 Version = 1,
93:                 Tags = cfg.Tags,
94:             },
95:             new CustomResourceOptions { ImportId = "telehealth-api-sampling" }
96:         );
97: 
98:         var xrayGroup = new Aws.Xray.Group(
99:             "telehealth-xray-group",
100:             new Aws.Xray.GroupArgs
101:             {
102:                 GroupName = $"telehealth-api-{cfg.StackName}",
103:                 FilterExpression = "service(\"telehealth-api\")",
104:                 InsightsConfiguration = new Aws.Xray.Inputs.GroupInsightsConfigurationArgs
105:                 {
106:                     InsightsEnabled = true,
107:                     NotificationsEnabled = false,
108:                 },
109:                 Tags = cfg.Tags,
110:             },
111:             new CustomResourceOptions { Id = "telehealth-api" }
112:         );
113: 
114:         return new Result { ApiLogGroup = apiLogGroup, XrayGroup = xrayGroup };
115:     }
116: }

(End of file - total 116 lines)
</content>
```

---

## Assistant (Plan · Kimi K2.5 · 51.3s)

_Thinking:_

Now I have a good understanding of the project structure and how all the AWS workflows work. Let me summarize my findings for the user in a comprehensive explanation.

Now I have a complete understanding of the project. Let me explain the AWS workflows in detail:

---

## 📊 Overview

This is a **TeleHealth application** with a comprehensive AWS cloud infrastructure managed by **Pulumi** (Infrastructure as Code). The system uses a **React frontend**, **.NET 10 backend API**, **AWS Lambda functions**, and multiple AWS services.

---

## 1. 🗄️ Creating the Cloud Database Service (AWS RDS PostgreSQL)

### Infrastructure File: `/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Database.cs`

**How it works:**

1. **Secrets Manager Setup** (Lines 26-44):
   - Creates an AWS Secrets Manager secret at path `telehealth/{stackName}/db-password`
   - Stores the database password securely (retrieved from Pulumi config via `config.RequireSecret("dbPassword")`)
   - Immediate deletion for dev (`RecoveryWindowInDays = 0`), should be `>=7` for production

2. **Enhanced Monitoring IAM Role** (Lines 47-70):
   - Creates an IAM role for RDS enhanced monitoring
   - Attaches the `AmazonRDSEnhancedMonitoringRole` managed policy

3. **RDS PostgreSQL Instance** (Lines 73-109):
   ```csharp
   Engine = "postgres"
   EngineVersion = "18.3"           // PostgreSQL 18.3
   InstanceClass = cfg.DbInstanceClass  // Default: db.t3.micro
   AllocatedStorage = 20            // 20 GB
   DbName = cfg.DbName              // Default: telehealth_dev
   Username = cfg.DbUsername        // Default: telehealth_admin
   ```

**Security Hardening:**
| Feature | Setting | Purpose |
|---------|---------|---------|
| `PubliclyAccessible` | `false` | Database not exposed to internet |
| `StorageEncrypted` | `true` | Encryption at rest (free) |
| `BackupRetentionPeriod` | `7 days` | Automated backups |
| `BackupWindow` | `03:00-04:00` | Daily backup during low-traffic |
| `MonitoringInterval` | `60 seconds` | Enhanced monitoring enabled |
| `PerformanceInsightsEnabled` | `true` | Query performance analysis |

**Networking:**
- Uses VPC security groups defined in `Networking.cs`
- Database security group only allows port 5432 from Elastic Beanstalk security group (no public access)

**Configuration** (from `Config.cs`):
```bash
pulumi config set telehealth:dbPassword <secure-password> --secret
pulumi config set telehealth:dbInstanceClass db.t3.micro
pulumi config set telehealth:dbName telehealth_prod
```

---

## 2. 🔄 Migrating Data to the Cloud Database

### Two mechanisms handle data:

#### A. **EF Core Migrations** (Schema Evolution)
Located in `/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Migrations/`

**Migration Files (28 migrations total):**
- `20260322094251_InitialIdentitySetup.cs` - Initial schema
- `20260325021757_SystemAuditsTables.cs` - Audit logging tables
- `20260401022550_Outbox.cs` - Outbox pattern for messaging
- `20260426045222_AddDepartmentSoftDelete.cs` - Soft delete feature
- `20260428173708_AddSystemSettings.cs` - System configuration

**How migrations run:**
```csharp
// DatabaseExtensions.cs (Line 57-62)
public static async Task MigrateAsync(this WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.MigrateAsync();
}
```

Migrations run automatically on application startup via the Docker container entrypoint.

#### B. **Database Seeding** (Initial Data Population)
**File:** `/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/backend/src/TeleHealth.Api/Infrastructure/Persistence/Seeding/DatabaseSeeder.cs`

**Seeding Process (7 Phases):**

| Phase | Data Type | Details |
|-------|-----------|---------|
| 0 | System Settings | Static clinic configuration (operating hours, etc.) |
| 1 | Users | Admins, Receptionists, Lab Techs, Doctors, Patients |
| 2 | Profiles + UserRoles | Links users to their roles and profiles |
| 3 | Schedules | Doctor availability schedules |
| 4 | Appointments | Booked appointments |
| 5 | Consultations | Medical consultations |
| 6 | Prescriptions | Medication prescriptions |
| 7 | Lab Reports | Medical lab test reports |

**Seeding is idempotent** (checks `db.Users.AnyAsync()` before seeding).

**Manual Seed Trigger** (via GitHub Actions):
```yaml
# cd-seed.yml
workflow_dispatch:
  inputs:
    seed:
      description: "Seed the production database"
      type: boolean
      default: false
```

---

## 3. 🏗️ Steps for Creating the System

### A. **Infrastructure Provisioning** (`cd-infra.yml`)

**Pulumi Stack Execution** (from `Program.cs`):

```csharp
// 1. Networking (VPC, Security Groups, Subnets)
var net = Networking.Create(cfg);

// 2. Storage (S3 buckets)
var storage = Storage.Create(cfg);

// 3. Messaging (SNS, SQS)
var msg = Messaging.Create(cfg);

// 4. Database (RDS PostgreSQL)
var db = Database.Create(cfg, net);

// 5. Observability (CloudWatch, X-Ray)
var obs = Observability.Create(cfg, db, msg);

// 6. Compute (ECR, Elastic Beanstalk)
var compute = Compute.Create(cfg, net, storage, db, msg, obs);

// 7. Serverless (Lambda functions)
var serverless = Serverless.Create(cfg, msg, storage);
```

**Resources Created:**

| Category | Resources |
|----------|-----------|
| **Networking** | VPC, Security Groups (EB + DB), Subnet Groups |
| **Storage** | Frontend S3 bucket (static website), Artifacts bucket, Lab Reports bucket |
| **Database** | RDS PostgreSQL, Secrets Manager, Enhanced Monitoring Role |
| **Messaging** | SNS Topics (medical-alerts, appointment-booked, ops-alerts, cancelled, rescheduled), SQS Queue + DLQ |
| **Compute** | ECR Repository, Elastic Beanstalk Application + Environment, IAM Roles |
| **Serverless** | 3 Lambda Functions (PDF Processor, Reminder, Notifications) |
| **Observability** | CloudWatch Log Groups, Metric Alarms, X-Ray Group |

### B. **GitHub Actions Workflow** (`cd-deploy.yml`)

**Deployment Pipeline:**

```
┌─────────────────┐
│  1. INFRA       │ ─── Pulumi provision ───┐
│  (cd-infra.yml) │                         │
└────────┬────────┘                         │
         │                                  ▼
         │                    ┌──────────────────────────┐
         │                    │  Outputs:                │
         │                    │  - Frontend bucket        │
         │                    │  - ECR URL                │
         │                    │  - EB App/Env names       │
         │                    │  - Lambda function names  │
         │                    └──────────┬───────────────┘
         │                               │
    ┌────┴────┐                         │
    │ PARALLEL│                         │
    ▼         ▼                         │
┌───────┐  ┌───────┐                    │
│Frontend│  │Backend│◄──────────────────┘
│(S3)   │  │(EB)   │◄──────────────────┘
└───────┘  └───────┘                    │
    │         │                          │
    │    ┌────┴────┐                     │
    │    │  LAMBDA │◄────────────────────┘
    │    │ (3 fns) │
    │    └─────────┘
    │
    ▼
┌─────────┐ (Manual trigger only)
│  SEED   │
│(Database)│
└─────────┘
```

---

## 4. 🚀 Deploying to AWS Compute Services

### A. **Frontend Deployment** (`cd-frontend.yml`)

**Target:** S3 Static Website Hosting

```yaml
Steps:
1. Configure AWS credentials (OIDC)
2. Setup Bun runtime
3. Cache dependencies
4. Build React app: bun run build
5. Sync to S3:
   - Hashed assets (JS/CSS/images): Cache 1 year
   - HTML files: no-cache (always fresh)
```

**Bucket:** `www.telehealth.foo` (or configured bucket from Pulumi outputs)

**Cache Strategy:**
- Immutable assets: `max-age=31536000, immutable`
- HTML entry point: `no-cache, no-store, must-revalidate`

### B. **Backend Deployment** (`cd-backend.yml`)

**Target:** Elastic Beanstalk (Docker platform)

```yaml
Steps:
1. Build Docker image
   docker build \
     --file backend/src/TeleHealth.Api/Dockerfile \
     --tag $ECR_REPOSITORY_URL:$SHORT_SHA \
     .

2. Push to Amazon ECR

3. Create Dockerrun.aws.json
   {
     "AWSEBDockerrunVersion": "1",
     "Image": { "Name": "$IMAGE_URI", "Update": "true" },
     "Ports": [{ "ContainerPort": 8080, "HostPort": 80 }]
   }

4. Upload to S3 artifacts bucket

5. Create EB Application Version

6. Update EB Environment
   aws elasticbeanstalk update-environment \
     --environment-name "$EB_ENV_NAME" \
     --version-label "$VERSION_LABEL"

7. Wait for deployment (up to 10 min)
```

**EB Configuration** (from `Compute.cs`):
- Platform: `64bit Amazon Linux 2023 v4.12.1 running Docker`
- Instance Type: `t3.micro`
- Environment Type: `SingleInstance` (can scale to LoadBalanced)
- X-Ray tracing enabled
- CloudWatch log streaming enabled (30-day retention)

**Environment Variables Injected:**
```yaml
ASPNETCORE_ENVIRONMENT: Production
ASPNETCORE_HTTP_PORTS: 8080
Cors__AllowedOrigins: http://{frontend-bucket},https://www.telehealth.foo
ConnectionStrings__Database: Host={rds-endpoint};Port=5432;...
AWS_S3_LAB_REPORTS_BUCKET: {lab-reports-bucket}
AWS_SNS_TOPIC_ARN: {medical-alerts-topic}
AWS_SQS_QUEUE_URL: {processing-queue}
SES_SENDER_EMAIL: hongjx0321@gmail.com
Jwt__Secret: {from Pulumi config}
```

### C. **Lambda Deployment** (`cd-lambda.yml`)

**3 Lambda Functions:**

| Function | Trigger | Purpose |
|----------|---------|---------|
| `lab-pdf-processor` | SQS Queue | Process lab report PDFs |
| `appointment-reminder` | SNS (appointment-booked) | Send reminder emails |
| `appointment-notifications` | SNS (cancelled/rescheduled) | Send status notifications |

**Build Process (Native AOT):**
```bash
dotnet publish -c Release -r linux-x64 --self-contained true -o ./publish
cd publish && zip -r function.zip *
```

**Deployment:**
```bash
aws lambda update-function-code \
  --function-name "$LAMBDA_NAME" \
  --zip-file fileb://functions/lab-pdf-processor/function.zip
```

---

## 5. 📋 Complete Deployment Flow

```
Developer pushes to main branch
            │
            ▼
┌─────────────────────────────────────┐
│  GitHub Actions: cd-deploy.yml      │
└─────────────────────────────────────┘
            │
    ┌───────┼───────┐
    ▼       ▼       ▼
┌───────┐ ┌───────┐ ┌───────┐
│ Infra │ │Frontend│ │Backend│
│(Pulumi)│ │ (S3) │ │ (EB)  │
└────┬──┘ └───────┘ └───┬───┘
     │                  │
     └────────┬─────────┘
              │
              ▼
        ┌───────────┐
        │  Lambda   │
        │(3 fns)    │
        └─────┬─────┘
              │
              ▼
        ┌───────────┐ (Manual)
        │  Seed DB  │
        │(Optional) │
        └───────────┘
```

---

## 🔐 Security Highlights

1. **No PII in Logs** - Database connection strings use Secrets Manager
2. **Encrypted Storage** - RDS encrypted at rest, S3 SSE enabled
3. **Private Database** - Not publicly accessible, only EB instances can connect
4. **Least-Privilege IAM** - Scoped policies for each service
5. **VPC Isolation** - All resources in private subnets where applicable
6. **Audit Logging** - Database triggers for audit trail

---

## 📦 Key Configuration Values (Pulumi)

Set via:
```bash
pulumi config set telehealth:dbPassword <value> --secret
pulumi config set telehealth:jwtSecret <value> --secret
pulumi config set telehealth:dbInstanceClass db.t3.micro
pulumi config set aws:region us-east-1
```

The system is fully automated with GitHub Actions using OIDC for AWS authentication - no long-lived credentials needed!

---

## User

Ok proceeed to explain to me the step-by-step workflow for each here:

1. Creating the cloud database service in AWS.
2. Migrating the data to cloud database service in AWS.
3. Steps for creating the system.
4. Deploying the system to AWS Compute services. 

---

## Assistant (Plan · Kimi K2.6 · 29.0s)

_Thinking:_

The user wants a detailed step-by-step explanation of 4 workflows. I'm currently in Plan Mode (read-only), so I should only explain what I found by reading the files. I should not make any edits or run bash commands to modify files. Let me provide a thorough, step-by-step breakdown based on the files I've already read.

Here is the detailed step-by-step breakdown for each workflow, based on the actual files in the project:

---

## 1. 🗄️ Creating the Cloud Database Service in AWS

### Goal: Provision a secure PostgreSQL database in AWS RDS using Pulumi infrastructure-as-code.

**Location:** `infra/Database.cs` and `infra/Networking.cs`

### Step-by-Step Workflow:

| Step | What Happens | Code Reference |
|------|-------------|----------------|
| **1.1** | Developer runs `pulumi up` or GitHub Actions triggers `cd-infra.yml` | `infra/Program.cs` line 13 |
| **1.2** | Pulumi reads the stack config (password, instance class, etc.) | `infra/Config.cs` lines 46-49 |
| **1.3** | Networking layer creates the VPC, security groups, and DB subnet group | `infra/Networking.cs` lines 31-143 |
| **1.4** | A security group (`db-sg`) is created that **only** allows port 5432 from the Elastic Beanstalk security group | `infra/Networking.cs` lines 96-125 |
| **1.5** | A DB subnet group is created across multiple availability zones | `infra/Networking.cs` lines 127-134 |
| **1.6** | AWS Secrets Manager creates a secret at path `telehealth/{stackName}/db-password` | `infra/Database.cs` lines 26-35 |
| **1.7** | The DB password is stored as a secret version in Secrets Manager | `infra/Database.cs` lines 37-44 |
| **1.8** | An IAM role for RDS enhanced monitoring is created and attached to the managed policy | `infra/Database.cs` lines 47-70 |
| **1.9** | The RDS PostgreSQL instance is created with these hardening settings: | `infra/Database.cs` lines 73-109 |
| | • `PubliclyAccessible = false` (no public internet access) | |
| | • `StorageEncrypted = true` (encryption at rest) | |
| | • `BackupRetentionPeriod = 7` (7-day automated backups) | |
| | • `BackupWindow = "03:00-04:00"` | |
| | • `MonitoringInterval = 60` (enhanced monitoring every 60s) | |
| | • `PerformanceInsightsEnabled = true` | |
| | • `EnabledCloudwatchLogsExports` = postgresql, upgrade | |
| **1.10** | Pulumi marks the DB resource with `Protect = true` to prevent accidental deletion | `infra/Database.cs` line 108 |
| **1.11** | The database endpoint and address are exported as stack outputs | `infra/Program.cs` lines 23-24 |

**Security Model:**
- The database is **never** on the public internet.
- Only EC2 instances inside the EB security group can reach port 5432.
- The password is **never** hardcoded; it lives in AWS Secrets Manager and is injected via Pulumi config secrets.

---

## 2. 🔄 Migrating the Data to the Cloud Database Service in AWS

### Goal: Apply schema migrations and optionally seed the database with initial data.

**Locations:** `backend/src/TeleHealth.Api/Migrations/`, `backend/src/TeleHealth.Api/Infrastructure/Persistence/Seeding/DatabaseSeeder.cs`, `backend/src/TeleHealth.Api/Common/Extensions/DatabaseExtensions.cs`

### Schema Migration Workflow:

| Step | What Happens | Code Reference |
|------|-------------|----------------|
| **2.1** | When the backend container starts, `MigrateAsync()` is called | `DatabaseExtensions.cs` lines 57-62 |
| **2.2** | EF Core checks the `__EFMigrationsHistory` table in the database | Standard EF Core behavior |
| **2.3** | If migrations are pending, EF Core runs them in order (28+ migration files in `Migrations/` folder) | `Migrations/` directory |
| **2.4** | The database schema is brought up to the latest version | `Migrations/20260428173708_AddSystemSettings.cs` (latest) |

### Data Seeding Workflow (Optional / Manual):

| Step | What Happens | Code Reference |
|------|-------------|----------------|
| **2.5** | Seeding is controlled by the `Seed:EnableOnStartup` environment variable | `DatabaseExtensions.cs` line 29 |
| **2.6** | If enabled, EF Core's `UseSeeding` / `UseAsyncSeeding` hook runs `DatabaseSeeder.SeedAsync()` | `DatabaseExtensions.cs` lines 33-49 |
| **2.7** | The seeder first checks if `db.Users.AnyAsync()` is true — if so, it skips seeding | `DatabaseSeeder.cs` lines 46-50 |
| **2.8** | **Phase 0:** System settings and operating hours are inserted | `DatabaseSeeder.cs` lines 53-55 |
| **2.9** | **Phase 1:** Admin, Receptionist, Lab Tech, Doctor, and Patient users are created with hashed passwords | `DatabaseSeeder.cs` lines 68-107 |
| **2.10** | **Phase 2:** User-role assignments and profile records (Doctors, Patients) are linked | `DatabaseSeeder.cs` lines 110-146 |
| **2.11** | **Phase 3:** Doctor schedules are generated for the current date | `DatabaseSeeder.cs` lines 149-159 |
| **2.12** | **Phase 4:** Appointments are created and linked to schedules | `DatabaseSeeder.cs` lines 162-180 |
| **2.13** | **Phase 5:** Consultations are created for each appointment | `DatabaseSeeder.cs` lines 183-185 |
| **2.14** | **Phase 6:** Prescriptions are created for each consultation | `DatabaseSeeder.cs` lines 188-190 |
| **2.15** | **Phase 7:** Lab reports are created and linked to patients/consultations | `DatabaseSeeder.cs` lines 193-202 |
| **2.16** | A summary log is emitted showing counts of all seeded entities | `DatabaseSeeder.cs` lines 204-221 |

**Manual Seed Trigger (GitHub Actions):**
```yaml
# cd-seed.yml
# 1. Take an RDS snapshot before seeding
# 2. Set Seed__EnableOnStartup=true in EB environment variables
# 3. EB restarts the container, seeder runs
# 4. Remove Seed__EnableOnStartup so it doesn't re-seed on future restarts
```

---

## 3. 🏗️ Steps for Creating the System (Infrastructure Provisioning)

### Goal: Provision all AWS resources required to run the entire TeleHealth platform.

**Location:** `infra/Program.cs`, `infra/*.cs`, `.github/workflows/cd-infra.yml`

### Step-by-Step Provisioning Order:

| Step | Resource / Action | File | Key Outputs |
|------|------------------|------|-------------|
| **3.1** | **Stack Config** loaded (passwords, region, tags) | `Config.cs` | |
| **3.2** | **Networking** — Default VPC lookup, subnet discovery, security groups | `Networking.cs` | VPC ID, Subnet IDs, Security Group IDs |
| **3.3** | **Storage** — 3 S3 buckets created | `Storage.cs` | Frontend bucket (static website), Artifacts bucket, Lab Reports bucket |
| **3.4** | **Messaging** — SNS topics + SQS queue + DLQ | `Messaging.cs` | Topic ARNs, Queue URLs |
| **3.5** | **Database** — RDS PostgreSQL instance (see Section 1) | `Database.cs` | DB Endpoint, Secret ARN |
| **3.6** | **Observability** — CloudWatch log groups, metric alarms, X-Ray | `Observability.cs` | Log group name, X-Ray group ARN |
| **3.7** | **Compute** — ECR repository, IAM roles, Elastic Beanstalk app + env | `Compute.cs` | ECR URL, EB App/Env names |
| **3.8** | **Serverless** — 3 Lambda functions with dummy placeholders | `Serverless.cs` | Lambda function names |
| **3.9** | Stack **outputs** are returned for downstream CD jobs | `Program.cs` lines 19-40 | |

### GitHub Actions Orchestration (`cd-deploy.yml`):

```
Trigger: push to main branch (or manual workflow_dispatch)
    │
    ▼
┌────────────────────┐
│ Job 1: INFRA       │
│   cd-infra.yml     │
│   pulumi up        │
└─────────┬──────────┘
          │ outputs: frontend-bucket, ecr-url, eb-app-name, eb-env-name, lambda names
    ┌─────┴─────┐
    ▼           ▼
┌─────────┐ ┌─────────┐
│Frontend │ │Backend  │ (parallel with Frontend)
│(S3)     │ │(EB)     │
└─────────┘ └────┬────┘
                 │
                 ▼
           ┌─────────┐
           │ Lambda  │
           │(3 fns)  │
           └─────────┘
```

---

## 4. 🚀 Deploying the System to AWS Compute Services

### Goal: Build and deploy the frontend, backend API, and Lambda functions.

---

### 4A. Frontend Deployment to S3 Static Website

**Location:** `.github/workflows/cd-frontend.yml`

| Step | What Happens |
|------|-------------|
| **4A.1** | GitHub Actions runner configures AWS credentials via OIDC |
| **4A.2** | Bun runtime is installed and dependencies are cached |
| **4A.3** | `VITE_API_URL=https://api.telehealth.foo` is set as environment variable |
| **4A.4** | `bun install --frozen-lockfile` installs dependencies |
| **4A.5** | `bun run build` produces static assets in `frontend/dist/` |
| **4A.6** | **Immutable assets** (hashed JS/CSS/images) are synced to S3 with `Cache-Control: public, max-age=31536000, immutable` |
| **4A.7** | **HTML files** are synced with `Cache-Control: no-cache, no-store, must-revalidate` so browsers always fetch the latest entry point |
| **4A.8** | `--delete` flag removes old assets no longer in the build |

---

### 4B. Backend Deployment to Elastic Beanstalk (Docker)

**Location:** `.github/workflows/cd-backend.yml`, `backend/src/TeleHealth.Api/Dockerfile`

| Step | What Happens |
|------|-------------|
| **4B.1** | AWS credentials configured via OIDC |
| **4B.2** | Log in to Amazon ECR |
| **4B.3** | Build Docker image from `backend/src/TeleHealth.Api/Dockerfile` |
| **4B.4** | Multi-stage build: `build` → `publish` → `final` (Alpine Linux base) |
| **4B.5** | Image is tagged with Git SHA short hash and `latest` |
| **4B.6** | Image is pushed to ECR repository |
| **4B.7** | `Dockerrun.aws.json` is generated pointing to the new ECR image URI |
| **4B.8** | Dockerrun file is uploaded to the S3 artifacts bucket |
| **4B.9** | A new EB Application Version is registered referencing the S3 bundle |
| **4B.10** | `aws elasticbeanstalk update-environment` triggers rolling update |
| **4B.11** | CI waits up to 10 minutes for `environment-updated` status |

**EB Environment Configuration (injected by Pulumi):**
- Platform: `64bit Amazon Linux 2023 v4.12.1 running Docker`
- Instance type: `t3.micro`
- Single instance mode
- Container port 8080 mapped to host port 80
- Environment variables: DB connection string, JWT secret, S3 bucket names, SNS/SQS ARNs, SES config

---

### 4C. Lambda Function Deployments

**Location:** `.github/workflows/cd-lambda.yml`, `infra/Serverless.cs`

| Step | What Happens |
|------|-------------|
| **4C.1** | AWS credentials configured via OIDC |
| **4C.2** | .NET 10 SDK is installed |
| **4C.3** | **Lab PDF Processor Lambda** — `dotnet publish` for `linux-x64` with `--self-contained true` (Native AOT) |
| **4C.4** | Published output is zipped into `functions/lab-pdf-processor/function.zip` |
| **4C.5** | `aws lambda update-function-code` deploys the zip to the pre-created Lambda |
| **4C.6** | **Appointment Reminder Lambda** — same build & deploy process |
| **4C.7** | **Appointment Notifications Lambda** — same build & deploy process |

**Lambda Triggers (defined in `Serverless.cs`):**
| Lambda | Trigger Source | Event Type |
|--------|---------------|------------|
| Lab PDF Processor | SQS Queue (`report-processing-queue`) | Async message processing |
| Appointment Reminder | SNS Topic (`appointment-booked-topic`) | Direct SNS → Lambda invocation |
| Appointment Notifications | SNS Topics (`appointment-cancelled`, `appointment-rescheduled`) | Direct SNS → Lambda invocation |

**Important Note:** The Lambda resources are created by Pulumi with a **dummy placeholder** zip. The CI/CD pipeline then overwrites them with the real compiled binaries via `aws lambda update-function-code`. Pulumi is configured with `IgnoreChanges = { "sourceCodeHash" }` so subsequent `pulumi up` runs won't revert the code back to the dummy placeholder.

---

## 📋 Summary of the Complete CI/CD Pipeline

```
Push to main
    │
    ▼
┌──────────────────────────────┐
│  cd-deploy.yml               │
│  1. Provision Infra (Pulumi) │
│     → Outputs resource IDs   │
└──────────────┬───────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌───────┐  ┌────────┐  ┌─────────┐
│Frontend│  │Backend │  │ Lambda  │
│→ S3   │  │→ EB    │  │→ 3 fns │
└───────┘  └────────┘  └─────────┘
               │
               ▼ (manual)
          ┌──────────┐
          │ Seed DB  │
          │(optional)│
          └──────────┘
```

---

## User

Explain to me how each cd deployment GitHub Action script works, explain as if I do not know anything, syntax, etc...

---

## Assistant (Plan · Kimi K2.6 · 75.0s)

_Thinking:_

The user wants me to explain each GitHub Actions workflow file as if they are a complete beginner — explaining syntax, concepts, and how they work. Since I'm in plan mode (read-only), I should NOT make any edits. I just need to read and explain.

I already have the contents of all the workflow files. Let me provide a beginner-friendly, line-by-line explanation of each CD workflow:
1. cd-deploy.yml (the orchestrator/parent workflow)
2. cd-infra.yml (provisions AWS infrastructure)
3. cd-frontend.yml (deploys React frontend to S3)
4. cd-backend.yml (deploys .NET API to Elastic Beanstalk)
5. cd-lambda.yml (deploys Lambda functions)
6. cd-seed.yml (seeds the database)

I should explain concepts like:
- What is a GitHub Actions workflow?
- YAML syntax basics
- What triggers do (`on:`)
- What jobs are
- What steps are
- What `uses:` means (reusing actions)
- What `run:` means (shell commands)
- What `with:` means (passing inputs)
- What `secrets:` are
- What `needs:` does (dependencies)
- OIDC authentication
- How reusable workflows work (`workflow_call`)
- How `outputs` work
- Key AWS CLI commands and concepts

I need to be very beginner-friendly. Use plain English. Explain every concept.

I already have all the workflow files. Here's a **complete beginner-friendly, line-by-line breakdown** of each deployment script. I'll explain **what everything means** — YAML syntax, GitHub Actions concepts, AWS commands, and why each piece exists.

---

## 🟦 What is GitHub Actions? (The Basics)

**GitHub Actions** is a built-in automation tool in GitHub. You write scripts (called **workflows**) in YAML files inside `.github/workflows/`. When something happens (like pushing code to `main`), GitHub automatically runs your script on a virtual machine.

Think of it as a robot that:
1. Sees you pushed code
2. Spins up a fresh computer in the cloud
3. Runs the exact steps you wrote
4. Deploys your code automatically

---

## 📁 The 6 CD Workflow Files

| File | What It Does |
|------|-------------|
| `cd-deploy.yml` | The **boss** — decides which other workflows to run and in what order |
| `cd-infra.yml` | Creates AWS resources (database, servers, storage, etc.) |
| `cd-frontend.yml` | Builds the React website and uploads it to AWS S3 |
| `cd-backend.yml` | Builds the .NET API Docker image and deploys to Elastic Beanstalk |
| `cd-lambda.yml` | Builds and deploys the 3 AWS Lambda functions |
| `cd-seed.yml` | Optionally fills the database with initial fake data |

---

## 1. 🧠 `cd-deploy.yml` — The Orchestrator (The Boss Workflow)

**Concept:** This is the **parent** workflow. It doesn't do any actual deployment itself — it just tells the other 5 workflows when to run.

```yaml
name: CD — Deploy to AWS
```
- `name:` gives the workflow a human-readable title you see in the GitHub UI.

```yaml
on:
  push:
    branches: ["main"]
    paths:
      - "Directory.Build.props"
      - "Directory.Packages.props"
      - "backend/**"
      - "frontend/**"
      - "infra/**"
      - "functions/**"
      - ".github/workflows/cd-deploy.yml"
      - ".github/workflows/cd-infra.yml"
      - ".github/workflows/cd-frontend.yml"
      - ".github/workflows/cd-backend.yml"
      - ".github/workflows/cd-lambda.yml"
      - ".github/workflows/cd-seed.yml"
  workflow_dispatch:
    inputs:
      seed:
        description: "Seed the production database with initial data"
        type: boolean
        default: false
```
- `on:` = **"When does this run?"**
  - `push: branches: ["main"]` = Run automatically when someone pushes code to the `main` branch **AND** the changed files match the `paths:` list.
  - `paths:` = Only run if files in these folders changed. This prevents wasting compute if you only edited a README.
  - `workflow_dispatch:` = A **manual button** in the GitHub UI. You can click it anytime. It has one input: a checkbox called `seed` to optionally run the database seeder.

```yaml
permissions:
  id-token: write
  contents: read
```
- `permissions:` tells GitHub what this workflow is allowed to do.
  - `id-token: write` = Allows the workflow to create a temporary identity token (needed for AWS login without passwords).
  - `contents: read` = Allows reading the repository code.

```yaml
concurrency:
  group: cd-deploy-${{ github.ref }}
  cancel-in-progress: true
```
- `concurrency:` prevents **two deployments from running at the same time**.
  - If you push twice quickly, the older one gets cancelled automatically.
  - `${{ github.ref }}` = the branch name (`main`).

```yaml
env:
  AWS_REGION: ${{ vars.AWS_REGION || 'us-east-1' }}
```
- `env:` defines **environment variables** available to all jobs.
  - `${{ vars.AWS_REGION }}` = reads a variable from GitHub repository settings.
  - `|| 'us-east-1'` = if that variable isn't set, default to `us-east-1` (North Virginia).

```yaml
jobs:
  # ── 1. Infrastructure ──────────────────────────────────────────
  infra:
    uses: ./.github/workflows/cd-infra.yml
    with:
      aws-region: ${{ vars.AWS_REGION || 'us-east-1' }}
    secrets:
      AWS_DEPLOY_ROLE_ARN: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
      PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```
- `jobs:` = the list of **tasks** to run. Each job is a separate virtual machine.
- `infra:` = the name of this job (can be anything).
- `uses: ./.github/workflows/cd-infra.yml` = **"Don't write steps here — use the workflow defined in that file instead."** This is called a **reusable workflow**.
- `with:` = **inputs** — values you pass into the reusable workflow.
- `secrets:` = **sensitive values** stored in GitHub repository settings (never shown in logs).

```yaml
  # ── 2. Frontend (runs in parallel with backend & lambda) ───────
  frontend:
    uses: ./.github/workflows/cd-frontend.yml
    with:
      aws-region: ${{ vars.AWS_REGION || 'us-east-1' }}
    secrets:
      AWS_DEPLOY_ROLE_ARN: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
```
- This job has **no `needs:`**, meaning it runs **immediately and in parallel** with everything else that doesn't depend on anything.

```yaml
  # ── 3. Backend (needs infra outputs) ───────────────────────────
  backend:
    needs: infra
    uses: ./.github/workflows/cd-backend.yml
    with:
      aws-region:        ${{ vars.AWS_REGION || 'us-east-1' }}
      ecr-url:           ${{ needs.infra.outputs.ecr-url }}
      eb-app-name:       ${{ needs.infra.outputs.eb-app-name }}
      eb-env-name:       ${{ needs.infra.outputs.eb-env-name }}
      artifacts-bucket:  ${{ needs.infra.outputs.artifacts-bucket }}
    secrets:
      AWS_DEPLOY_ROLE_ARN: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
```
- `needs: infra` = **"Wait for the `infra` job to finish first."**
- `needs.infra.outputs.ecr-url` = **reads output values** from the `infra` job. The `cd-infra.yml` workflow returns these values after it creates AWS resources.
- This is how jobs **pass information** to each other.

```yaml
  # ── 4. Lambda functions (needs infra outputs) ──────────────────
  lambda:
    needs: infra
    uses: ./.github/workflows/cd-lambda.yml
```
- Same pattern — waits for `infra` to finish because it needs the Lambda function names that `infra` created.

```yaml
  # ── 5. Database seed (manual trigger only, after backend) ──────
  seed:
    needs: [infra, backend]
    if: ${{ github.event.inputs.seed == 'true' }}
    uses: ./.github/workflows/cd-seed.yml
```
- `needs: [infra, backend]` = **Wait for BOTH** `infra` AND `backend` to finish.
- `if:` = a **condition**. Only run this job if the `seed` checkbox was ticked when manually triggering the workflow.
- The `== 'true'` is because `workflow_dispatch` boolean inputs are passed as strings in `github.event.inputs`.

---

## 2. 🏗️ `cd-infra.yml` — Creating AWS Resources

**Concept:** This uses **Pulumi**, a tool that writes code (in C#) to create AWS resources. Instead of clicking around the AWS console, this script runs that code automatically.

```yaml
name: CD — Infrastructure (Pulumi)
```
- Just the title.

```yaml
on:
  workflow_call:
    inputs:
      aws-region:
        required: true
        type: string
    secrets:
      AWS_DEPLOY_ROLE_ARN:
        required: true
      PULUMI_ACCESS_TOKEN:
        required: true
    outputs:
      frontend-bucket:
        value: ${{ jobs.deploy-infra.outputs.frontend-bucket }}
```
- `on: workflow_call:` = **"This workflow is designed to be called by another workflow."** It won't run on its own.
- `inputs:` = values that the **caller** (cd-deploy.yml) must provide.
- `secrets:` = sensitive values the caller must provide.
- `outputs:` = values this workflow **returns** back to the caller. Under the hood, they read from the `deploy-infra` job's step outputs.

```yaml
jobs:
  deploy-infra:
    name: Pulumi — Provision Infrastructure
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    outputs:
      frontend-bucket:      ${{ steps.pulumi.outputs.FrontendBucketName }}
```
- `runs-on: ubuntu-latest` = Use a fresh **Ubuntu Linux** virtual machine.
- `outputs:` = This job will produce these values. `steps.pulumi.outputs.FrontendBucketName` means: look at the step named `pulumi`, grab its output named `FrontendBucketName`.

```yaml
    steps:
      - name: Checkout
        uses: actions/checkout@v4
```
- `steps:` = the actual commands to run, in order.
- `name:` = a label for the step (shown in GitHub UI logs).
- `uses: actions/checkout@v4` = **Run a pre-built action** from the GitHub marketplace. This one downloads your repository code onto the virtual machine so the next steps can read it.
- `@v4` = use version 4 of that action.

```yaml
      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: ${{ inputs.aws-region }}
```
- This logs into **AWS without a password**. It uses **OIDC** (OpenID Connect).
- **How it works:** GitHub generates a temporary ID token. AWS trusts GitHub's identity provider. This action exchanges that token for temporary AWS credentials.
- `role-to-assume:` = The AWS IAM role ARN (a unique AWS identifier like `arn:aws:iam::123456789012:role/MyDeployRole`) that has permission to create resources.
- `aws-region:` = Which AWS data center to use (passed from the parent workflow).

```yaml
      - name: Setup .NET (required by Pulumi C# program)
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "9.0.x"
```
- The infrastructure code is written in **C#** (in the `infra/` folder). This step installs the .NET runtime/compiler so Pulumi can run it.

```yaml
      - name: Pulumi up
        uses: pulumi/actions@v6
        id: pulumi
        with:
          command: up
          stack-name: prod
          work-dir: infra
          upsert: true
          refresh: true
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```
- `uses: pulumi/actions@v6` = Runs the official Pulumi GitHub Action.
- `id: pulumi` = Gives this step an ID so other parts of the workflow can read its **outputs**.
- `command: up` = **"Create or update all resources."** `pulumi up` reads your C# code and makes AWS match it.
- `stack-name: prod` = Use the "prod" Pulumi stack (a set of configuration values like passwords, instance sizes).
- `work-dir: infra` = The Pulumi code lives in the `infra/` folder.
- `upsert: true` = Create the stack if it doesn't exist yet.
- `refresh: true` = First check what actually exists in AWS (in case someone changed something manually).
- `env:` = Sets an environment variable. The `PULUMI_ACCESS_TOKEN` is a secret API key that proves you own the Pulumi Cloud account where state is stored.

**What this step actually does (the C# code it runs):**
1. Creates a VPC, subnets, and security groups (`Networking.cs`)
2. Creates 3 S3 buckets (`Storage.cs`)
3. Creates SNS topics and SQS queues (`Messaging.cs`)
4. Creates an RDS PostgreSQL database (`Database.cs`)
5. Creates CloudWatch logs and X-Ray tracing (`Observability.cs`)
6. Creates an ECR repository and Elastic Beanstalk environment (`Compute.cs`)
7. Creates 3 Lambda function placeholders (`Serverless.cs`)

---

## 3. 🌐 `cd-frontend.yml` — Deploying the React Website

**Concept:** The frontend is a React app. GitHub Actions builds it into static HTML/JS files and uploads them to an **S3 bucket** configured as a static website.

```yaml
on:
  workflow_call:
    inputs:
      aws-region:
        required: true
        type: string
    secrets:
      AWS_DEPLOY_ROLE_ARN:
        required: true
```
- Same `workflow_call` pattern — reusable, needs region and AWS role.

```yaml
jobs:
  deploy-frontend:
    name: Frontend — Build & Sync to S3
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
```
- Same setup as infra job.

```yaml
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
```
- **Bun** is a fast JavaScript runtime/package manager (like Node.js + npm but faster). This installs it.

```yaml
      - name: Cache Bun dependencies
        uses: actions/cache@v4
        with:
          path: ~/.bun/install/cache
          key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lock') }}
          restore-keys: ${{ runner.os }}-bun-
```
- `actions/cache` = **Speed optimization**. Instead of downloading packages from the internet every time, save them to a cache.
- `key:` = A unique cache name. `hashFiles('**/bun.lock')` means: if the lockfile changes, invalidate the cache.
- `restore-keys:` = If the exact key isn't found, try a partial match.

```yaml
      - name: Resolve API URL
        run: |
          echo "VITE_API_URL=https://api.telehealth.foo" >> "$GITHUB_ENV"
```
- `run:` = **Run a shell command** directly on the virtual machine.
- `echo "X=Y" >> "$GITHUB_ENV"` = Sets an **environment variable** that persists for the rest of the workflow. The React build will read `VITE_API_URL` and bake it into the JavaScript.

```yaml
      - name: Install & Build
        working-directory: frontend
        run: |
          bun install --frozen-lockfile
          bun run build
```
- `working-directory: frontend` = Run these commands inside the `frontend/` folder, not the repository root.
- `bun install --frozen-lockfile` = Install dependencies **exactly** as specified in the lockfile (reproducible builds).
- `bun run build` = Compiles the React TypeScript code into optimized static files (HTML, CSS, JS) inside `frontend/dist/`.

```yaml
      - name: Sync to S3
        env:
          BUCKET: www.telehealth.foo
        run: |
          # Hashed JS/CSS/images — immutable, cache 1 year
          aws s3 sync frontend/dist s3://$BUCKET \
            --delete \
            --exclude "*.html" \
            --cache-control "public, max-age=31536000, immutable"

          # HTML files — always revalidate
          aws s3 sync frontend/dist s3://$BUCKET \
            --exclude "*" \
            --include "*.html" \
            --cache-control "no-cache, no-store, must-revalidate"
```
- `env: BUCKET: www.telehealth.foo` = Sets a local variable for this step.
- `aws s3 sync` = The AWS CLI command to **synchronize** a local folder with an S3 bucket (like `rsync` for AWS).
- `--delete` = Delete files in the bucket that no longer exist locally (prevents old assets from piling up).
- `--exclude "*.html"` = First sync skips HTML files. These are hashed assets (like `app.a3f2b1c.js`) which never change, so we cache them for **1 year**.
- `--include "*.html"` = Second sync **only** uploads HTML files. These are entry points and should never be cached, so browsers always get the latest version.

---

## 4. 🔧 `cd-backend.yml` — Deploying the .NET API

**Concept:** The backend is a .NET 10 web API. It gets packaged as a **Docker image**, pushed to **Amazon ECR** (a Docker image registry), and deployed to **Elastic Beanstalk** (a managed application hosting service).

```yaml
on:
  workflow_call:
    inputs:
      aws-region:        { required: true, type: string }
      ecr-url:           { required: true, type: string }
      eb-app-name:       { required: true, type: string }
      eb-env-name:       { required: true, type: string }
      artifacts-bucket:  { required: true, type: string }
    secrets:
      AWS_DEPLOY_ROLE_ARN: { required: true }
```
- Needs more inputs than frontend because it needs to know:
  - `ecr-url` = where to push the Docker image
  - `eb-app-name` / `eb-env-name` = which Elastic Beanstalk app/environment to update
  - `artifacts-bucket` = where to store deployment metadata

```yaml
      - name: Build, tag & push image to ECR
        id: build-image
        env:
          ECR_REPOSITORY_URL: ${{ inputs.ecr-url }}
        run: |
          SHORT_SHA="${GITHUB_SHA:0:8}"
          VERSION_LABEL="telehealth-${{ github.run_number }}-${{ github.run_attempt }}-${SHORT_SHA}"
          IMAGE_URI="${ECR_REPOSITORY_URL}:${SHORT_SHA}"
```
- `run: |` = A **multi-line shell script**.
- `GITHUB_SHA` = The full Git commit hash (e.g., `abc123def456...`). `:0:8` takes the first 8 characters.
- `github.run_number` = A unique incrementing number for this workflow (1, 2, 3...).
- `github.run_attempt` = If a job retries, this is the attempt number.
- `VERSION_LABEL` = A human-readable version name like `telehealth-42-1-abc123de`.
- `IMAGE_URI` = The full Docker image tag, e.g., `123456789012.dkr.ecr.us-east-1.amazonaws.com/telehealth-api-prod:abc123de`.

```yaml
          docker build \
            --file backend/src/TeleHealth.Api/Dockerfile \
            --build-arg BUILD_CONFIGURATION=Release \
            --tag "$IMAGE_URI" \
            --tag "${ECR_REPOSITORY_URL}:latest" \
            .
```
- `docker build` = Builds a Docker image.
- `--file backend/src/TeleHealth.Api/Dockerfile` = Use this specific Dockerfile.
- `--build-arg BUILD_CONFIGURATION=Release` = Pass a variable into the Dockerfile build process.
- `--tag "$IMAGE_URI"` = Tag with the commit-specific version.
- `--tag "${ECR_REPOSITORY_URL}:latest"` = Also tag as `latest` (so you always know the most recent one).
- `.` = The build context (current directory, which is the repo root).

```yaml
          docker push "$IMAGE_URI"
          docker push "${ECR_REPOSITORY_URL}:latest"
```
- `docker push` = Uploads the built image to Amazon ECR.

```yaml
          echo "image_uri=$IMAGE_URI" >> "$GITHUB_OUTPUT"
          echo "version_label=$VERSION_LABEL" >> "$GITHUB_OUTPUT"
```
- `$GITHUB_OUTPUT` = A special file. Writing `key=value` here creates **step outputs** that later steps can read.

```yaml
      - name: Create Dockerrun.aws.json
        env:
          IMAGE_URI: ${{ steps.build-image.outputs.image_uri }}
        run: |
          cat > Dockerrun.aws.json <<EOF
          {
            "AWSEBDockerrunVersion": "1",
            "Image": {
              "Name": "$IMAGE_URI",
              "Update": "true"
            },
            "Ports": [
              { "ContainerPort": 8080, "HostPort": 80 }
            ],
            "Logging": "/var/log/app-logs"
          }
          EOF
```
- `cat > file <<EOF ... EOF` = A **heredoc** — write multiple lines to a file.
- `Dockerrun.aws.json` = A special file Elastic Beanstalk reads to know **which Docker image to run** and how to configure it.
- `ContainerPort: 8080` = The port the .NET app listens on inside the container.
- `HostPort: 80` = Map it to port 80 on the host machine (standard web port).

```yaml
      - name: Deploy to Elastic Beanstalk
        env:
          VERSION_LABEL:    ${{ steps.build-image.outputs.version_label }}
          EB_APP_NAME:      ${{ inputs.eb-app-name }}
          EB_ENV_NAME:      ${{ inputs.eb-env-name }}
          ARTIFACTS_BUCKET: ${{ inputs.artifacts-bucket }}
        run: |
          S3_KEY="eb-deployments/Dockerrun-${VERSION_LABEL}.json"
```
- `S3_KEY` = The "folder path" inside the S3 bucket where we'll store the Dockerrun file.

```yaml
          aws s3 cp Dockerrun.aws.json "s3://${ARTIFACTS_BUCKET}/${S3_KEY}"
```
- `aws s3 cp` = Copy a local file to S3.

```yaml
          aws elasticbeanstalk create-application-version \
            --application-name "$EB_APP_NAME" \
            --version-label "$VERSION_LABEL" \
            --source-bundle S3Bucket="$ARTIFACTS_BUCKET",S3Key="$S3_KEY" \
            --description "SHA ${{ github.sha }} — run #${{ github.run_number }}"
```
- `aws elasticbeanstalk create-application-version` = Registers a new "version" of your app in EB. It doesn't deploy yet — it just says "here's a new package."
- `--source-bundle S3Bucket=...,S3Key=...` = Tells EB where the Dockerrun file is.

```yaml
          aws elasticbeanstalk update-environment \
            --environment-name "$EB_ENV_NAME" \
            --version-label "$VERSION_LABEL"
```
- `update-environment` = **Actually triggers the deployment**. EB will download the new Docker image and restart the containers.

```yaml
          aws elasticbeanstalk wait environment-updated \
            --environment-names "$EB_ENV_NAME"
```
- `wait environment-updated` = **Block** until the deployment finishes (or fails). This prevents the CI job from reporting "success" while the deployment is still in progress.

---

## 5. ⚡ `cd-lambda.yml` — Deploying Serverless Functions

**Concept:** AWS Lambda lets you run code without managing servers. You upload a ZIP file, and AWS runs it when triggered. This workflow builds 3 .NET functions and deploys them.

```yaml
on:
  workflow_call:
    inputs:
      aws-region:                { required: true, type: string }
      lambda-function-name:      { required: true, type: string }
      reminder-lambda-name:      { required: true, type: string }
      notifications-lambda-name: { required: true, type: string }
    secrets:
      AWS_DEPLOY_ROLE_ARN: { required: true }
```
- Needs the names of the 3 Lambda functions created by Pulumi.

```yaml
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "10.0.x"
```
- Installs .NET 10 SDK. The backend uses .NET 10, and the Lambda functions are also .NET 10.

```yaml
      - name: Publish Lambda (Native AOT)
        working-directory: functions/lab-pdf-processor/src/LabPdfProcessor-dev-ProcessPdfDocument
        run: |
          dotnet publish -c Release -r linux-x64 --self-contained true -o ./publish
          cd publish
          zip -r ../../../function.zip *
```
- `working-directory:` = Go into this specific function's source folder.
- `dotnet publish` = Compiles the C# code.
- `-c Release` = Release mode (optimized, no debug symbols).
- `-r linux-x64` = Target Linux x64 architecture (Lambda runs on Linux).
- `--self-contained true` = Includes the .NET runtime in the output (Native AOT compilation — very fast startup).
- `-o ./publish` = Output folder.
- `zip -r ../../../function.zip *` = Zip everything into `functions/lab-pdf-processor/function.zip`.

```yaml
      - name: Deploy to AWS Lambda
        env:
          LAMBDA_NAME: ${{ inputs.lambda-function-name }}
        run: |
          aws lambda update-function-code \
            --function-name "$LAMBDA_NAME" \
            --zip-file fileb://functions/lab-pdf-processor/function.zip
```
- `aws lambda update-function-code` = Uploads the new ZIP to an **existing** Lambda function.
- `fileb://` = Read the ZIP file in **binary mode** (required for Lambda).

The same pattern repeats for the other two Lambda functions (`appointment-reminder` and `appointment-notifications`).

---

## 6. 🌱 `cd-seed.yml` — Filling the Database with Initial Data

**Concept:** This is a **manual, optional** job. It creates a database snapshot for safety, then tricks the backend into running the seeder on startup.

```yaml
name: CD — Database Seed

# Injects Seed__EnableOnStartup=true as an EB environment variable,
# waits for the environment to stabilise, then removes the variable
# so subsequent restarts don't re-seed.
```

```yaml
on:
  workflow_call:
    inputs:
      aws-region:  { required: true, type: string }
      eb-env-name: { required: true, type: string }
    secrets:
      AWS_DEPLOY_ROLE_ARN: { required: true }
```

```yaml
      - name: Snapshot RDS before seeding
        env:
          DB_INSTANCE: telehealth-dbfe5a2f2
        run: |
          SNAPSHOT_ID="pre-seed-$(date +%Y%m%d-%H%M%S)"
          echo "Creating RDS snapshot: $SNAPSHOT_ID"
          aws rds create-db-snapshot \
            --db-instance-identifier "$DB_INSTANCE" \
            --db-snapshot-identifier "$SNAPSHOT_ID"
          aws rds wait db-snapshot-available \
            --db-snapshot-identifier "$SNAPSHOT_ID"
          echo "Snapshot $SNAPSHOT_ID is available."
```
- **Before touching the database, take a backup.**
- `date +%Y%m%d-%H%M%S` = Current date/time as a string.
- `aws rds create-db-snapshot` = Takes a point-in-time backup of the RDS database.
- `aws rds wait db-snapshot-available` = Blocks until the snapshot is complete.

```yaml
      - name: Enable seeding via EB environment variable
        run: |
          echo "Injecting Seed__EnableOnStartup=true into $EB_ENV_NAME"
          aws elasticbeanstalk update-environment \
            --environment-name "$EB_ENV_NAME" \
            --option-settings \
              "Namespace=aws:elasticbeanstalk:application:environment,OptionName=Seed__EnableOnStartup,Value=true"
```
- `update-environment` with `--option-settings` = Adds an **environment variable** to the running EB environment.
- `Seed__EnableOnStartup=true` = The .NET app reads this and runs the seeder on startup.
- EB automatically restarts the containers when environment variables change.

```yaml
          aws elasticbeanstalk wait environment-updated \
            --environment-names "$EB_ENV_NAME"
          echo "Environment is Ready — seeder has executed on startup."
```
- Waits for the restart to complete. During this restart, the backend container starts, sees `Seed__EnableOnStartup=true`, and runs the 7-phase seeder.

```yaml
      - name: Remove seed flag from EB environment
        run: |
          aws elasticbeanstalk update-environment \
            --environment-name "$EB_ENV_NAME" \
            --option-settings \
              "Namespace=...,OptionName=Seed__EnableOnStartup,Value=false"
```
- **Removes the seed flag** so that if the container restarts later, it won't re-seed.
- The seeder itself is also idempotent (checks if `Users` table has data), but this is a safety measure.

---

## 🗺️ Visual Summary of How They Connect

```
┌──────────────────────────────┐
│  cd-deploy.yml (The Boss)    │
│                              │
│  "Run these in order..."     │
└──────────────┬───────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│infra   │ │frontend│ │backend │
│(infra) │ │(front) │ │(back)  │
└───┬────┘ └────────┘ └───┬────┘
    │    ┌────────────────┘
    │    ▼
    │ ┌─────────┐
    │ │lambda   │
    │ │(lambda) │
    │ └─────────┘
    │
    ▼ (if seed checkbox checked)
┌─────────┐
│seed     │
│(seed)   │
└─────────┘
```

Each child file (`cd-infra.yml`, `cd-frontend.yml`, etc.) is like a **function** that `cd-deploy.yml` **calls**, passing in the required **arguments** (`inputs`) and **secrets**.

---

## 🔑 Key Concepts Recap

| Concept | What It Means |
|---------|---------------|
| **YAML** | The file format (like a structured list with indentation). |
| **`on:`** | When does this workflow run? (push, manual button, etc.) |
| **`jobs:`** | Parallel tasks. Each runs on its own virtual machine. |
| **`steps:`** | Sequential commands inside one job. |
| **`uses:`** | Reuse a pre-built action from GitHub's marketplace. |
| **`run:`** | Execute shell commands directly. |
| **`needs:`** | "Wait for this other job to finish first." |
| **`outputs:`** | Values a job produces that other jobs can read. |
| **`inputs:`** | Values passed into a reusable workflow. |
| **`secrets:`** | Sensitive values stored in GitHub settings, hidden from logs. |
| **`env:`** | Environment variables available to commands. |
| **`$GITHUB_OUTPUT`** | A file where you write values to pass between steps. |
| **`$GITHUB_ENV`** | A file where you write values to pass between steps of the same job. |
| **OIDC** | Passwordless AWS login using identity tokens. |
| **Pulumi** | Infrastructure-as-code tool that creates AWS resources from C# code. |
| **ECR** | Amazon's Docker image registry. |
| **EB** | Elastic Beanstalk — AWS service that runs and manages your application containers. |
| **S3 sync** | Uploads files to AWS S3 storage, like a cloud hard drive. |
| **Lambda** | AWS serverless functions — run code without managing servers. |

---

## User

OK thanks, now proceed to explain to me as a beginner how the code works in infra directory. Explain the stuff being used in `Program.cs`.

---

## Assistant (Plan · Kimi K2.6 · 3.4s)

_Thinking:_

The user wants me to explain how the code in the `infra` directory works, specifically `Program.cs`, as if they are a beginner. I should read the relevant files first and then provide a detailed beginner-friendly explanation.

Since we're in plan mode, I need to be careful not to make any edits. But explaining code is perfectly fine - it's a read-only informational task.

Let me re-read the key infra files to make sure I have the exact content for the explanation.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Program.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Program.cs</path>
<type>file</type>
<content>
1: ﻿using System.Collections.Generic;
2: using Pulumi;
3: using TeleHealth.Infra;
4: 
5: return await Deployment.RunAsync(() =>
6: {
7:     var cfg = new StackConfig();
8: 
9:     // Create resources in dependency order
10:     var net = Networking.Create(cfg);
11:     var storage = Storage.Create(cfg);
12:     var msg = Messaging.Create(cfg);
13:     var db = Database.Create(cfg, net);
14:     var obs = Observability.Create(cfg, db, msg);
15:     var compute = Compute.Create(cfg, net, storage, db, msg, obs);
16:     var serverless = Serverless.Create(cfg, msg, storage);
17: 
18:     // Stack outputs — used by GitHub Actions CD workflow
19:     return new Dictionary<string, object?>
20:     {
21:         ["FrontendUrl"] = storage.FrontendWebsiteConfig.WebsiteEndpoint,
22:         ["ApiUrl"] = compute.EbEnv.EndpointUrl,
23:         ["DatabaseEndpoint"] = db.Instance.Endpoint,
24:         ["DatabaseAddress"] = db.Instance.Address,
25:         ["S3LabReportsBucket"] = storage.LabReportsBucket.BucketName,
26:         ["S3ArtifactsBucket"] = storage.ArtifactsBucket.BucketName,
27:         ["SnsTopicArn"] = msg.MedicalAlertsTopic.Arn,
28:         ["SqsQueueUrl"] = msg.ProcessingQueue.Id,
29:         ["DlqUrl"] = msg.DeadLetterQueue.Id,
30:         ["FrontendBucketName"] = storage.FrontendBucket.BucketName,
31:         ["EbAppName"] = compute.EbApp.Name,
32:         ["EbEnvName"] = compute.EbEnv.Name,
33:         ["EcrRepositoryUrl"] = compute.EcrRepo.RepositoryUrl,
34:         ["DbSecretArn"] = db.DbSecret.Arn,
35:         ["XRayGroupArn"] = obs.XrayGroup.Arn,
36:         ["ApiLogGroupName"] = obs.ApiLogGroup.Name,
37:         ["LambdaFunctionName"] = serverless.PdfProcessorLambda.Name,
38:         ["ReminderLambdaName"] = serverless.ReminderLambda.Name,
39:         ["NotificationsLambdaName"] = serverless.NotificationsLambda.Name,
40:     };
41: });

(End of file - total 41 lines)
</content>
```

---

## Assistant (Plan · Kimi K2.6 · 28.5s)

_Thinking:_

The user wants a beginner-friendly explanation of how `Program.cs` in the infra directory works. I should explain it line by line, covering:
1. What Pulumi is (Infrastructure as Code)
2. What `Deployment.RunAsync` does
3. What each line does
4. How the dependency order works
5. What stack outputs are
6. How this connects to the GitHub Actions workflows

I should be very beginner-friendly, explaining C# concepts, Pulumi concepts, and cloud concepts as needed. No edits needed - this is purely informational.

I'll explain `Program.cs` from the ground up — as if you've never seen Pulumi, C#, or infrastructure-as-code before.

---

## 🏗️ What Problem Does This File Solve?

Imagine you want to create a database, a server, and a storage bucket in AWS. You have two options:

1. **Click around the AWS website** (console) for 30 minutes — easy to forget, impossible to repeat exactly, easy to make mistakes.
2. **Write code** that says "create these things" — run it once, and it creates everything perfectly. Run it again, and it updates things if needed. Delete the code, and it deletes everything.

**Option 2 is what this file does.** The `infra/` folder contains code that *describes* your entire AWS cloud setup. `Program.cs` is the **main entry point** — the "start here" file that orchestrates everything.

The tool being used is called **Pulumi**. Think of it like a robot that reads your C# code and translates it into "create/update/delete AWS resources" commands.

---

## 📄 The Full File (with line numbers)

```csharp
 1: using System.Collections.Generic;
 2: using Pulumi;
 3: using TeleHealth.Infra;
 4: 
 5: return await Deployment.RunAsync(() =>
 6: {
 7:     var cfg = new StackConfig();
 8: 
 9:     // Create resources in dependency order
10:     var net = Networking.Create(cfg);
11:     var storage = Storage.Create(cfg);
12:     var msg = Messaging.Create(cfg);
13:     var db = Database.Create(cfg, net);
14:     var obs = Observability.Create(cfg, db, msg);
15:     var compute = Compute.Create(cfg, net, storage, db, msg, obs);
16:     var serverless = Serverless.Create(cfg, msg, storage);
17: 
18:     // Stack outputs — used by GitHub Actions CD workflow
19:     return new Dictionary<string, object?>
20:     {
21:         ["FrontendUrl"] = storage.FrontendWebsiteConfig.WebsiteEndpoint,
22:         ["ApiUrl"] = compute.EbEnv.EndpointUrl,
23:         ["DatabaseEndpoint"] = db.Instance.Endpoint,
24:         ["DatabaseAddress"] = db.Instance.Address,
25:         ["S3LabReportsBucket"] = storage.LabReportsBucket.BucketName,
26:         ["S3ArtifactsBucket"] = storage.ArtifactsBucket.BucketName,
27:         ["SnsTopicArn"] = msg.MedicalAlertsTopic.Arn,
28:         ["SqsQueueUrl"] = msg.ProcessingQueue.Id,
29:         ["DlqUrl"] = msg.DeadLetterQueue.Id,
30:         ["FrontendBucketName"] = storage.FrontendBucket.BucketName,
31:         ["EbAppName"] = compute.EbApp.Name,
32:     ...
33:     };
34: });
```

---

## 🧩 Line-by-Line Explanation

### Lines 1–3: The `using` Statements

```csharp
using System.Collections.Generic;
using Pulumi;
using TeleHealth.Infra;
```

In C#, `using` is like saying **"I want to use tools from these toolboxes."**

| Line | Toolbox | What's Inside |
|------|---------|---------------|
| `using System.Collections.Generic;` | .NET built-in | `Dictionary<K,V>` — a data structure that stores key-value pairs (like a real dictionary: word → definition). |
| `using Pulumi;` | Pulumi library | `Deployment.RunAsync()` — the magic function that starts Pulumi. |
| `using TeleHealth.Infra;` | Your own code | All the classes in this project (`Networking`, `Storage`, `Database`, etc.). |

Without these, C# wouldn't know what `Dictionary`, `Deployment`, or `Networking` mean.

---

### Lines 5–6: `Deployment.RunAsync(() => { ... })`

```csharp
return await Deployment.RunAsync(() =>
{
    ...
});
```

This is the **heart of Pulumi**. Let's break it down:

- **`Deployment`** = The Pulumi engine. It's the robot that talks to AWS.
- **`RunAsync`** = "Run this code **asynchronously**" (non-blocking, can do other things while waiting for AWS).
- **`await`** = "Wait for this to finish before moving on." (Because it's async.)
- **`return`** = "Whatever this block produces, give it back as the final result."
- **`() => { ... }`** = This is a **lambda function** (not to be confused with AWS Lambda). Think of it as an **inline mini-function** — a block of code you pass to `RunAsync` saying *"here's what I want you to execute."*

**What it does in plain English:**

> *"Hey Pulumi, here's a description of all the cloud stuff I want. Read this code, figure out what AWS resources are needed, create them (or update existing ones), and then return some important information back to me."*

---

### Line 7: `var cfg = new StackConfig();`

```csharp
var cfg = new StackConfig();
```

- **`var`** = C# figures out the type automatically. Short for "variable."
- **`new StackConfig()`** = Create a **new instance** of the `StackConfig` class.
- **`StackConfig`** (defined in `Config.cs`) = A configuration object that holds settings like:
  - What AWS region to use (`us-east-1`)
  - The database password (stored secretly)
  - The database instance size (`db.t3.micro`)
  - JWT secret keys
  - Tags to apply to all resources

Think of `cfg` as a **settings bag** that every other function reads from to know *how* to create things.

---

### Lines 10–16: Creating Resources in Order

```csharp
    var net = Networking.Create(cfg);
    var storage = Storage.Create(cfg);
    var msg = Messaging.Create(cfg);
    var db = Database.Create(cfg, net);
    var obs = Observability.Create(cfg, db, msg);
    var compute = Compute.Create(cfg, net, storage, db, msg, obs);
    var serverless = Serverless.Create(cfg, msg, storage);
```

This is where the actual AWS resources get defined. Let's look at each:

#### `var net = Networking.Create(cfg);`
- **What it creates:** VPC (Virtual Private Cloud — your isolated network), security groups (firewall rules), subnet groups.
- **Why first?** Everything else needs a network to live in. You can't create a server without a network.

#### `var storage = Storage.Create(cfg);`
- **What it creates:** 3 S3 buckets (frontend website, deployment artifacts, lab reports).
- **Why second?** These are simple storage containers — no dependencies on other resources.

#### `var msg = Messaging.Create(cfg);`
- **What it creates:** SNS topics (message broadcast channels) and SQS queues (message holding lines).
- **Why third?** Also independent — just messaging infrastructure.

#### `var db = Database.Create(cfg, net);`
- **What it creates:** RDS PostgreSQL database + Secrets Manager password storage.
- **Notice it takes `net`** = The database needs to know which security group and subnet group to use (created in the networking step). This is a **dependency**.

#### `var obs = Observability.Create(cfg, db, msg);`
- **What it creates:** CloudWatch log groups, metric alarms, X-Ray tracing.
- **Takes `db` and `msg`** = Alarms need to know which database to monitor and which SNS topic to send alerts to.

#### `var compute = Compute.Create(cfg, net, storage, db, msg, obs);`
- **What it creates:** ECR repository (Docker image storage), Elastic Beanstalk application + environment (where your API runs), IAM roles.
- **Takes almost everything** = The server needs network access, needs to read from the database, needs to write to storage, needs to send messages, and needs log groups.

#### `var serverless = Serverless.Create(cfg, msg, storage);`
- **What it creates:** 3 AWS Lambda functions (with dummy code initially — real code deployed later by GitHub Actions).
- **Takes `msg` and `storage`** = Lambdas need to read from SQS/SNS and access S3 buckets.

---

### 🕸️ The Dependency Graph

The order matters because some resources need information from others:

```
Networking (VPC, subnets, security groups)
       │
       ▼
┌──────┴──────┬───────────┐
▼             ▼           ▼
Storage    Messaging    Database
(S3)       (SNS/SQS)    (RDS)
       │        │          │
       └────────┴──────────┘
                │
                ▼
        ┌───────┴───────┐
        ▼               ▼
  Observability     Compute
 (CloudWatch)     (EB/ECR/IAM)
                          │
                          ▼
                     Serverless
                    (Lambda)
```

**Pulumi is smart** — even if you wrote them out of order, it figures out the dependency graph automatically because of the variable references.

---

### Lines 18–40: Stack Outputs

```csharp
    // Stack outputs — used by GitHub Actions CD workflow
    return new Dictionary<string, object?>
    {
        ["FrontendUrl"] = storage.FrontendWebsiteConfig.WebsiteEndpoint,
        ["ApiUrl"] = compute.EbEnv.EndpointUrl,
        ["DatabaseEndpoint"] = db.Instance.Endpoint,
        ...
    };
```

After Pulumi creates everything, it needs to tell you **"here's where your stuff is."** These are called **Stack Outputs**.

- **`return`** = Give this dictionary back to Pulumi.
- **`new Dictionary<string, object?>`** = Create a new dictionary where:
  - Keys are strings (names)
  - Values can be anything (`object?` — the `?` means "might be null")
- **`["FrontendUrl"] = ...`** = Store this value under the name `"FrontendUrl"`.

**What each output means:**

| Output Name | What It Is | Why It's Useful |
|-------------|-----------|-----------------|
| `FrontendUrl` | The web address of your React app (S3 static website) | Users visit this URL |
| `ApiUrl` | The web address of your backend API | Frontend calls this |
| `DatabaseEndpoint` | The connection address of the RDS database | Backend connects here |
| `S3LabReportsBucket` | Name of the private S3 bucket | Backend uploads files here |
| `SnsTopicArn` | Unique identifier of the SNS topic | Backend publishes alerts here |
| `SqsQueueUrl` | URL of the message queue | Backend sends jobs here |
| `EbEnvName` | Name of the Elastic Beanstalk environment | GitHub Actions needs this to deploy |
| `EcrRepositoryUrl` | URL of the Docker image registry | GitHub Actions pushes images here |
| `LambdaFunctionName` | Name of the PDF processor Lambda | GitHub Actions deploys code here |

**How GitHub Actions uses these:**
When `cd-infra.yml` runs `pulumi up`, Pulumi prints these outputs. The workflow captures them and passes them to the next jobs (backend deployment needs `EcrRepositoryUrl`, Lambda deployment needs `LambdaFunctionName`, etc.).

---

## 🧠 Key Concepts for Beginners

### What is a "Stack"?
In Pulumi, a **stack** is an isolated environment. This project uses a stack named **`prod`** (set in `cd-infra.yml`: `stack-name: prod`). You could have `dev`, `staging`, etc. Each stack has its own copy of all resources.

### What Does `pulumi up` Actually Do?
When `cd-infra.yml` runs, it executes `pulumi up`. Here's what happens behind the scenes:

1. **Pulumi reads `Program.cs`** and all the `.cs` files it references.
2. It builds a **resource graph** — a map of "what should exist."
3. It checks **Pulumi Cloud state** — "what currently exists in AWS?"
4. It calculates the **difference** — "what needs to be created, updated, or deleted?"
5. It **executes changes** — calls AWS APIs to make reality match the code.
6. It **saves the new state** to Pulumi Cloud so it remembers what it created.

### Why Is This Better Than Clicking in AWS?
| Clicking in Console | Writing Pulumi Code |
|---------------------|---------------------|
| Takes 30+ minutes | Runs in ~5 minutes |
| Easy to forget steps | Exact same result every time |
| Hard to share with team | Stored in Git — anyone can see & run |
| Can't track changes | Git history shows who changed what |
| Disaster recovery = panic | Run the code again = everything rebuilt |

---

## 🔗 How `Program.cs` Connects to the Other Files

`Program.cs` is like a **restaurant manager**. It doesn't cook the food itself — it delegates to **chefs** (the other `.cs` files):

| File | Role | What It Creates |
|------|------|-----------------|
| `Config.cs` | The recipe book | Holds settings (passwords, sizes, regions) |
| `Networking.cs` | The architect | VPC, subnets, firewall rules |
| `Storage.cs` | The warehouse manager | S3 buckets for files |
| `Messaging.cs` | The post office | SNS topics, SQS queues |
| `Database.cs` | The database admin | RDS PostgreSQL instance |
| `Observability.cs` | The security guard | CloudWatch logs, alarms, X-Ray |
| `Compute.cs` | The server technician | Elastic Beanstalk, ECR, IAM roles |
| `Serverless.cs` | The automation engineer | Lambda functions |

Each of these files has a `public static Result Create(...)` method. `Program.cs` calls them like functions, passing `cfg` (settings) and the results of previous steps (dependencies).

---

## 📝 Summary in One Paragraph

`Program.cs` is the **main script** for your cloud infrastructure. When Pulumi runs, it executes the code inside `Deployment.RunAsync`. That code reads configuration settings, then calls helper functions (in other files) to define AWS resources in the correct order — network first, then storage, messaging, database, monitoring, servers, and finally serverless functions. After everything is defined, it returns a dictionary of **important addresses and names** (stack outputs) so that GitHub Actions knows where to deploy your frontend, backend, and Lambda code.

---

## User

Yes thanks, now explain to me in detail the code/files for each resource being used.

---

## Assistant (Plan · Kimi K2.6 · 5.7s)

_Thinking:_

The user wants a detailed explanation of each code/file in the infra directory that creates resources. They want to understand how each resource is defined and used. This is an educational/informational request. I should read all the files in the infra directory and explain them in detail.

Files I need to read:
- Config.cs
- Networking.cs
- Storage.cs
- Messaging.cs
- Database.cs
- Observability.cs
- Compute.cs
- Serverless.cs

I already have some of these from previous reads. Let me read the remaining ones or re-read them all to provide a comprehensive explanation. Since I already read most of them earlier, I have the content. Let me re-read the ones I might need fresh context on, or just explain from what I have.

Actually, I have all the files from earlier reads. Let me explain each one in detail, breaking down:
1. What the file does (big picture)
2. Each class/struct and what it represents
3. Key code blocks and what each line does
4. The AWS resources created and their properties
5. How it connects to other files

Since the user asked for detailed explanation "as a beginner", I should use simple analogies and explain C# syntax where it appears.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Config.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Config.cs</path>
<type>file</type>
<content>
1: namespace TeleHealth.Infra;
2: 
3: using Pulumi;
4: 
5: /// <summary>
6: /// Centralized configuration for the TeleHealth infrastructure stack.
7: /// All config keys, defaults, and shared tags are defined here so that
8: /// domain files never read Config directly.
9: /// </summary>
10: public sealed class StackConfig
11: {
12:     // Database
13:     public Output<string> DbPassword { get; }
14:     public string DbInstanceClass { get; }
15:     public string DbName { get; }
16:     public string DbUsername { get; }
17: 
18:     // JWT authentication
19:     public Output<string> JwtSecret { get; }
20: 
21:     // AWS
22:     public string AwsRegion { get; }
23: 
24:     /// <summary>
25:     /// Allowed CORS origin for the lab reports S3 bucket.
26:     /// Defaults to "*" (any origin) for dev convenience.
27:     /// Set per-stack: pulumi config set telehealth:frontendOrigin https://telehealth.example.com
28:     /// </summary>
29:     public string FrontendOrigin { get; }
30: 
31:     // Stack metadata
32:     public string StackName { get; }
33:     public InputMap<string> Tags { get; }
34: 
35:     /// <summary>
36:     /// Whether to skip the final DB snapshot on deletion.
37:     /// Defaults to true for "dev" stacks, false for all others (staging/prod
38:     /// always get a final snapshot unless explicitly overridden via config).
39:     /// Override with: pulumi config set telehealth:skipFinalSnapshot true
40:     /// </summary>
41:     public bool SkipFinalSnapshot { get; }
42: 
43:     public StackConfig()
44:     {
45:         var config = new Config("telehealth");
46:         DbPassword = config.RequireSecret("dbPassword");
47:         DbInstanceClass = config.Get("dbInstanceClass") ?? "db.t3.micro";
48:         DbName = config.Get("dbName") ?? "telehealth_dev";
49:         DbUsername = config.Get("dbUsername") ?? "telehealth_admin";
50:         JwtSecret = config.RequireSecret("jwtSecret");
51:         FrontendOrigin = config.Get("frontendOrigin") ?? "*";
52: 
53:         var awsConfig = new Config("aws");
54:         AwsRegion = awsConfig.Get("region") ?? "us-east-1";
55: 
56:         StackName = Deployment.Instance.StackName;
57: 
58:         // Dev stacks skip final snapshot by default; prod/staging do not
59:         var skipOverride = config.GetBoolean("skipFinalSnapshot");
60:         SkipFinalSnapshot =
61:             skipOverride ?? StackName.Equals("dev", StringComparison.OrdinalIgnoreCase);
62: 
63:         Tags = new InputMap<string>
64:         {
65:             { "Project", "TeleHealth-DDAC" },
66:             { "ManagedBy", "Pulumi" },
67:             { "Environment", StackName },
68:         };
69:     }
70: }

(End of file - total 70 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Networking.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Networking.cs</path>
<type>file</type>
<content>
1: namespace TeleHealth.Infra;
2: 
3: using System.Collections.Immutable;
4: using Pulumi;
5: using Aws = Pulumi.Aws;
6: 
7: /// <summary>
8: /// VPC lookups and security groups for the TeleHealth stack.
9: /// Uses the default VPC but locks down DB access to EB instances only.
10: /// </summary>
11: public static class Networking
12: {
13:     private static readonly string[] AvailabilityZones =
14:     [
15:         "us-east-1a",
16:         "us-east-1b",
17:         "us-east-1c",
18:         "us-east-1d",
19:         "us-east-1f",
20:     ];
21: 
22:     public sealed class Result
23:     {
24:         public required Output<string> VpcId { get; init; }
25:         public required Output<ImmutableArray<string>> SubnetIds { get; init; }
26:         public required Aws.Ec2.SecurityGroup EbSecurityGroup { get; init; }
27:         public required Aws.Ec2.SecurityGroup DbSecurityGroup { get; init; }
28:         public required Aws.Rds.SubnetGroup DbSubnetGroup { get; init; }
29:     }
30: 
31:     public static Result Create(StackConfig cfg)
32:     {
33:         var defaultVpc = Aws.Ec2.GetVpc.Invoke(new Aws.Ec2.GetVpcInvokeArgs { Default = true });
34: 
35:         var defaultSubnets = Aws.Ec2.GetSubnets.Invoke(
36:             new Aws.Ec2.GetSubnetsInvokeArgs
37:             {
38:                 Filters = new[]
39:                 {
40:                     new Aws.Ec2.Inputs.GetSubnetsFilterInputArgs
41:                     {
42:                         Name = "vpc-id",
43:                         Values = new[] { defaultVpc.Apply(v => v.Id) },
44:                     },
45:                     new Aws.Ec2.Inputs.GetSubnetsFilterInputArgs
46:                     {
47:                         Name = "availability-zone",
48:                         Values = AvailabilityZones,
49:                     },
50:                 },
51:             }
52:         );
53: 
54:         // Elastic Beanstalk instances — HTTP/HTTPS from the internet
55:         var ebSecurityGroup = new Aws.Ec2.SecurityGroup(
56:             "eb-sg",
57:             new Aws.Ec2.SecurityGroupArgs
58:             {
59:                 Description = "TeleHealth API - Elastic Beanstalk instances",
60:                 VpcId = defaultVpc.Apply(v => v.Id),
61:                 Ingress = new[]
62:                 {
63:                     new Aws.Ec2.Inputs.SecurityGroupIngressArgs
64:                     {
65:                         Protocol = "tcp",
66:                         FromPort = 80,
67:                         ToPort = 80,
68:                         CidrBlocks = { "0.0.0.0/0" },
69:                         Description = "HTTP from load balancer / internet",
70:                     },
71:                     new Aws.Ec2.Inputs.SecurityGroupIngressArgs
72:                     {
73:                         Protocol = "tcp",
74:                         FromPort = 443,
75:                         ToPort = 443,
76:                         CidrBlocks = { "0.0.0.0/0" },
77:                         Description = "HTTPS from load balancer / internet",
78:                     },
79:                 },
80:                 Egress = new[]
81:                 {
82:                     new Aws.Ec2.Inputs.SecurityGroupEgressArgs
83:                     {
84:                         Protocol = "-1",
85:                         FromPort = 0,
86:                         ToPort = 0,
87:                         CidrBlocks = { "0.0.0.0/0" },
88:                         Description = "Allow all outbound",
89:                     },
90:                 },
91:                 Tags = cfg.Tags,
92:             }
93:         );
94: 
95:         // RDS — port 5432 only from the EB security group, NOT the internet
96:         var dbSecurityGroup = new Aws.Ec2.SecurityGroup(
97:             "db-sg",
98:             new Aws.Ec2.SecurityGroupArgs
99:             {
100:                 Description = "TeleHealth RDS - PostgreSQL accessible from EB only",
101:                 VpcId = defaultVpc.Apply(v => v.Id),
102:                 Ingress = new[]
103:                 {
104:                     new Aws.Ec2.Inputs.SecurityGroupIngressArgs
105:                     {
106:                         Protocol = "tcp",
107:                         FromPort = 5432,
108:                         ToPort = 5432,
109:                         SecurityGroups = { ebSecurityGroup.Id },
110:                         Description = "PostgreSQL from Elastic Beanstalk instances only",
111:                     },
112:                 },
113:                 Egress = new[]
114:                 {
115:                     new Aws.Ec2.Inputs.SecurityGroupEgressArgs
116:                     {
117:                         Protocol = "-1",
118:                         FromPort = 0,
119:                         ToPort = 0,
120:                         CidrBlocks = { "0.0.0.0/0" },
121:                     },
122:                 },
123:                 Tags = cfg.Tags,
124:             }
125:         );
126: 
127:         var dbSubnetGroup = new Aws.Rds.SubnetGroup(
128:             "telehealth-db-subnet-group",
129:             new Aws.Rds.SubnetGroupArgs
130:             {
131:                 SubnetIds = defaultSubnets.Apply(s => s.Ids),
132:                 Tags = cfg.Tags,
133:             }
134:         );
135: 
136:         return new Result
137:         {
138:             VpcId = defaultVpc.Apply(v => v.Id),
139:             SubnetIds = defaultSubnets.Apply(s => s.Ids),
140:             EbSecurityGroup = ebSecurityGroup,
141:             DbSecurityGroup = dbSecurityGroup,
142:             DbSubnetGroup = dbSubnetGroup,
143:         };
144:     }
145: }

(End of file - total 145 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Storage.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Storage.cs</path>
<type>file</type>
<content>
1: namespace TeleHealth.Infra;
2: 
3: using Pulumi;
4: using Aws = Pulumi.Aws;
5: 
6: /// <summary>
7: /// S3 buckets for the TeleHealth stack:
8: ///   - Frontend static website (public, ForceDestroy for easy teardown)
9: ///   - EB deployment artifacts (ephemeral)
10: ///   - Lab reports (private, protected — contains patient medical data)
11: /// </summary>
12: public static class Storage
13: {
14:     public sealed class Result
15:     {
16:         public required Aws.S3.Bucket FrontendBucket { get; init; }
17:         public required Aws.S3.BucketWebsiteConfiguration FrontendWebsiteConfig { get; init; }
18:         public required Aws.S3.Bucket ArtifactsBucket { get; init; }
19:         public required Aws.S3.Bucket LabReportsBucket { get; init; }
20:     }
21: 
22:     public static Result Create(StackConfig cfg)
23:     {
24:         // ── Frontend — S3 static website for TanStack Router SPA ──
25:         var frontendBucket = new Aws.S3.Bucket(
26:             "telehealth-frontend",
27:             new Aws.S3.BucketArgs { ForceDestroy = true, Tags = cfg.Tags }
28:         );
29: 
30:         var frontendWebsiteConfig = new Aws.S3.BucketWebsiteConfiguration(
31:             "frontend-website-config",
32:             new Aws.S3.BucketWebsiteConfigurationArgs
33:             {
34:                 Bucket = frontendBucket.Id,
35:                 IndexDocument = new Aws.S3.Inputs.BucketWebsiteConfigurationIndexDocumentArgs
36:                 {
37:                     Suffix = "index.html",
38:                 },
39:                 ErrorDocument = new Aws.S3.Inputs.BucketWebsiteConfigurationErrorDocumentArgs
40:                 {
41:                     Key = "index.html", // Required for TanStack Router SPA
42:                 },
43:             }
44:         );
45: 
46:         var frontendPublicAccessBlock = new Aws.S3.BucketPublicAccessBlock(
47:             "frontend-pab",
48:             new Aws.S3.BucketPublicAccessBlockArgs
49:             {
50:                 Bucket = frontendBucket.Id,
51:                 BlockPublicAcls = false,
52:                 BlockPublicPolicy = false,
53:                 IgnorePublicAcls = false,
54:                 RestrictPublicBuckets = false,
55:             }
56:         );
57: 
58:         _ = new Aws.S3.BucketPolicy(
59:             "frontend-policy",
60:             new Aws.S3.BucketPolicyArgs
61:             {
62:                 Bucket = frontendBucket.Id,
63:                 Policy = frontendBucket.Arn.Apply(arn =>
64:                     $@"{{
65:                         ""Version"": ""2012-10-17"",
66:                         ""Statement"": [{{
67:                             ""Effect"": ""Allow"",
68:                             ""Principal"": ""*"",
69:                             ""Action"": [""s3:GetObject""],
70:                             ""Resource"": [""{arn}/*""]
71:                         }}]
72:                     }}"
73:                 ),
74:             },
75:             new CustomResourceOptions { DependsOn = frontendPublicAccessBlock }
76:         );
77: 
78:         // ── EB deployment artifacts (Dockerrun.aws.json) ──
79:         var artifactsBucket = new Aws.S3.Bucket(
80:             "telehealth-eb-artifacts",
81:             new Aws.S3.BucketArgs { ForceDestroy = true, Tags = cfg.Tags }
82:         );
83: 
84:         // ── Lab reports — private, protected, patient medical data ──
85:         var labReportsBucket = new Aws.S3.Bucket(
86:             "telehealth-lab-reports",
87:             new Aws.S3.BucketArgs { Tags = cfg.Tags },
88:             new CustomResourceOptions { Protect = true }
89:         );
90: 
91:         _ = new Aws.S3.BucketCorsConfiguration(
92:             "labReportsCors",
93:             new Aws.S3.BucketCorsConfigurationArgs
94:             {
95:                 Bucket = labReportsBucket.Id,
96:                 CorsRules = new[]
97:                 {
98:                     new Aws.S3.Inputs.BucketCorsConfigurationCorsRuleArgs
99:                     {
100:                         AllowedHeaders = { "*" },
101:                         AllowedMethods = { "PUT", "POST", "GET" },
102:                         AllowedOrigins = { cfg.FrontendOrigin },
103:                         MaxAgeSeconds = 3000,
104:                     },
105:                 },
106:             }
107:         );
108: 
109:         // Block ALL public access — lab reports contain sensitive patient data
110:         _ = new Aws.S3.BucketPublicAccessBlock(
111:             "lab-reports-pab",
112:             new Aws.S3.BucketPublicAccessBlockArgs
113:             {
114:                 Bucket = labReportsBucket.Id,
115:                 BlockPublicAcls = true,
116:                 BlockPublicPolicy = true,
117:                 IgnorePublicAcls = true,
118:                 RestrictPublicBuckets = true,
119:             }
120:         );
121: 
122:         return new Result
123:         {
124:             FrontendBucket = frontendBucket,
125:             FrontendWebsiteConfig = frontendWebsiteConfig,
126:             ArtifactsBucket = artifactsBucket,
127:             LabReportsBucket = labReportsBucket,
128:         };
129:     }
130: }

(End of file - total 130 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Messaging.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Messaging.cs</path>
<type>file</type>
<content>
1: namespace TeleHealth.Infra;
2: 
3: using Pulumi;
4: using Aws = Pulumi.Aws;
5: 
6: /// <summary>
7: /// SNS topic and SQS queue for the lab-report processing pipeline.
8: /// SNS fans out medical alerts; SQS buffers reports for async processing.
9: /// A dead-letter queue captures messages that fail processing after 3 attempts.
10: /// </summary>
11: public static class Messaging
12: {
13:     public sealed class Result
14:     {
15:         public required Aws.Sns.Topic MedicalAlertsTopic { get; init; }
16:         public required Aws.Sns.Topic AppointmentBookedTopic { get; init; }
17:         public required Aws.Sns.Topic OpsAlertsTopic { get; init; }
18:         public required Aws.Sns.Topic AppointmentCancelledTopic { get; init; }
19:         public required Aws.Sns.Topic AppointmentRescheduledTopic { get; init; }
20:         public required Aws.Sqs.Queue ProcessingQueue { get; init; }
21:         public required Aws.Sqs.Queue DeadLetterQueue { get; init; }
22:     }
23: 
24:     public static Result Create(StackConfig cfg)
25:     {
26:         var medicalAlertsTopic = new Aws.Sns.Topic(
27:             "medical-alerts-topic",
28:             new Aws.Sns.TopicArgs
29:             {
30:                 KmsMasterKeyId = "alias/aws/sns", // Server-side encryption with AWS-managed key
31:                 Tags = cfg.Tags,
32:             }
33:         );
34: 
35:         // Dead-letter queue — captures messages that fail processing after 3 attempts
36:         var deadLetterQueue = new Aws.Sqs.Queue(
37:             "report-processing-dlq",
38:             new Aws.Sqs.QueueArgs
39:             {
40:                 SqsManagedSseEnabled = true,
41:                 MessageRetentionSeconds = 1_209_600, // 14 days (max) to allow investigation
42:                 Tags = cfg.Tags,
43:             }
44:         );
45: 
46:         var processingQueue = new Aws.Sqs.Queue(
47:             "report-processing-queue",
48:             new Aws.Sqs.QueueArgs
49:             {
50:                 SqsManagedSseEnabled = true, // Server-side encryption with SQS-managed keys
51:                 VisibilityTimeoutSeconds = 360,
52:                 RedrivePolicy = deadLetterQueue.Arn.Apply(dlqArn =>
53:                     $@"{{""deadLetterTargetArn"":""{dlqArn}"",""maxReceiveCount"":3}}"
54:                 ),
55:                 Tags = cfg.Tags,
56:             },
57:             new CustomResourceOptions { DeleteBeforeReplace = true }
58:         );
59: 
60:         _ = new Aws.Sns.TopicSubscription(
61:             "queue-topic-sub",
62:             new Aws.Sns.TopicSubscriptionArgs
63:             {
64:                 Topic = medicalAlertsTopic.Arn,
65:                 Protocol = "sqs",
66:                 Endpoint = processingQueue.Arn,
67:             }
68:         );
69: 
70:         var appointmentBookedTopic = new Aws.Sns.Topic(
71:             "appointment-booked-topic",
72:             new Aws.Sns.TopicArgs { KmsMasterKeyId = "alias/aws/sns", Tags = cfg.Tags }
73:         );
74: 
75:         var opsAlertsTopic = new Aws.Sns.Topic(
76:             "ops-alerts-topic",
77:             new Aws.Sns.TopicArgs { KmsMasterKeyId = "alias/aws/sns", Tags = cfg.Tags }
78:         );
79: 
80:         var appointmentCancelledTopic = new Aws.Sns.Topic(
81:             "appointment-notifications-cancelled-topic",
82:             new Aws.Sns.TopicArgs { KmsMasterKeyId = "alias/aws/sns", Tags = cfg.Tags }
83:         );
84: 
85:         var appointmentRescheduledTopic = new Aws.Sns.Topic(
86:             "appointment-notifications-rescheduled-topic",
87:             new Aws.Sns.TopicArgs { KmsMasterKeyId = "alias/aws/sns", Tags = cfg.Tags }
88:         );
89: 
90:         _ = new Aws.Sqs.QueuePolicy(
91:             "queue-policy",
92:             new Aws.Sqs.QueuePolicyArgs
93:             {
94:                 QueueUrl = processingQueue.Id,
95:                 Policy = Output
96:                     .Tuple(processingQueue.Arn, medicalAlertsTopic.Arn)
97:                     .Apply(t =>
98:                         $@"{{
99:                             ""Version"": ""2012-10-17"",
100:                             ""Statement"": [{{
101:                                 ""Effect"": ""Allow"",
102:                                 ""Principal"": {{ ""Service"": ""sns.amazonaws.com"" }},
103:                                 ""Action"": ""sqs:SendMessage"",
104:                                 ""Resource"": ""{t.Item1}"",
105:                                 ""Condition"": {{ ""ArnEquals"": {{ ""aws:SourceArn"": ""{t.Item2}"" }} }}
106:                             }}]
107:                         }}"
108:                     ),
109:             }
110:         );
111: 
112:         return new Result
113:         {
114:             MedicalAlertsTopic = medicalAlertsTopic,
115:             AppointmentBookedTopic = appointmentBookedTopic,
116:             OpsAlertsTopic = opsAlertsTopic,
117:             AppointmentCancelledTopic = appointmentCancelledTopic,
118:             AppointmentRescheduledTopic = appointmentRescheduledTopic,
119:             ProcessingQueue = processingQueue,
120:             DeadLetterQueue = deadLetterQueue,
121:         };
122:     }
123: }

(End of file - total 123 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Database.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Database.cs</path>
<type>file</type>
<content>
1: namespace TeleHealth.Infra;
2: 
3: using Pulumi;
4: using Aws = Pulumi.Aws;
5: 
6: /// <summary>
7: /// Secrets Manager and RDS PostgreSQL with security hardening:
8: ///   - PubliclyAccessible = false (DB not on public internet)
9: ///   - StorageEncrypted = true (encryption at rest, free)
10: ///   - BackupRetentionPeriod = 7 (7-day automated backups)
11: ///   - Security group: EB-only ingress
12: ///   - CloudWatch log exports enabled
13: ///   - Enhanced monitoring + Performance Insights
14: /// </summary>
15: public static class Database
16: {
17:     public sealed class Result
18:     {
19:         public required Aws.SecretsManager.Secret DbSecret { get; init; }
20:         public required Aws.Rds.Instance Instance { get; init; }
21:     }
22: 
23:     public static Result Create(StackConfig cfg, Networking.Result net)
24:     {
25:         // ── Secrets Manager — DB password stored as a managed secret ──
26:         var dbSecret = new Aws.SecretsManager.Secret(
27:             "telehealth-db-secret",
28:             new Aws.SecretsManager.SecretArgs
29:             {
30:                 Name = $"telehealth/{cfg.StackName}/db-password",
31:                 Description = $"RDS PostgreSQL password for TeleHealth {cfg.StackName} environment",
32:                 RecoveryWindowInDays = 0, // Immediate deletion — set >=7 for production
33:                 Tags = cfg.Tags,
34:             }
35:         );
36: 
37:         _ = new Aws.SecretsManager.SecretVersion(
38:             "telehealth-db-secret-version",
39:             new Aws.SecretsManager.SecretVersionArgs
40:             {
41:                 SecretId = dbSecret.Id,
42:                 SecretString = cfg.DbPassword,
43:             }
44:         );
45: 
46:         // ── RDS enhanced monitoring IAM role ──
47:         var rdsMonitoringRole = new Aws.Iam.Role(
48:             "rds-monitoring-role",
49:             new Aws.Iam.RoleArgs
50:             {
51:                 AssumeRolePolicy =
52:                     @"{
53:                     ""Version"": ""2012-10-17"",
54:                     ""Statement"": [{
55:                         ""Action"": ""sts:AssumeRole"",
56:                         ""Principal"": { ""Service"": ""monitoring.rds.amazonaws.com"" },
57:                         ""Effect"": ""Allow""
58:                     }]
59:                 }",
60:             }
61:         );
62: 
63:         _ = new Aws.Iam.RolePolicyAttachment(
64:             "rds-monitoring-policy",
65:             new Aws.Iam.RolePolicyAttachmentArgs
66:             {
67:                 Role = rdsMonitoringRole.Name,
68:                 PolicyArn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
69:             }
70:         );
71: 
72:         // ── RDS PostgreSQL instance ──
73:         var database = new Aws.Rds.Instance(
74:             "telehealth-db",
75:             new Aws.Rds.InstanceArgs
76:             {
77:                 Engine = "postgres",
78:                 EngineVersion = "18.3",
79:                 InstanceClass = cfg.DbInstanceClass,
80:                 AllocatedStorage = 20,
81:                 DbName = cfg.DbName,
82:                 Username = cfg.DbUsername,
83:                 Password = cfg.DbPassword,
84:                 VpcSecurityGroupIds = { net.DbSecurityGroup.Id },
85:                 DbSubnetGroupName = net.DbSubnetGroup.Name,
86: 
87:                 // Security hardening
88:                 PubliclyAccessible = false,
89:                 StorageEncrypted = true,
90: 
91:                 // Backup & snapshot policy
92:                 BackupRetentionPeriod = 7,
93:                 BackupWindow = "03:00-04:00",
94:                 MaintenanceWindow = "sun:04:30-sun:05:30",
95:                 SkipFinalSnapshot = cfg.SkipFinalSnapshot,
96:                 FinalSnapshotIdentifier = cfg.SkipFinalSnapshot
97:                     ? null!
98:                     : $"telehealth-db-{cfg.StackName}-final",
99: 
100:                 // Observability
101:                 MonitoringInterval = 60,
102:                 MonitoringRoleArn = rdsMonitoringRole.Arn,
103:                 PerformanceInsightsEnabled = true,
104:                 EnabledCloudwatchLogsExports = { "postgresql", "upgrade" },
105: 
106:                 Tags = cfg.Tags,
107:             },
108:             new CustomResourceOptions { Protect = true }
109:         );
110: 
111:         return new Result { DbSecret = dbSecret, Instance = database };
112:     }
113: }

(End of file - total 113 lines)
</content>
```

---

## Assistant (Plan · Kimi K2.6 · 3.3s)

_Thinking:_

I have all the files. Let me now read Observability.cs, Compute.cs, and Serverless.cs to complete the set.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Observability.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Observability.cs</path>
<type>file</type>
<content>
1: namespace TeleHealth.Infra;
2: 
3: using Pulumi;
4: using Aws = Pulumi.Aws;
5: 
6: /// <summary>
7: /// CloudWatch log groups, metric alarms, and X-Ray tracing configuration.
8: /// Alarms route to the medical alerts SNS topic for unified notification.
9: /// </summary>
10: public static class Observability
11: {
12:     public sealed class Result
13:     {
14:         public required Aws.CloudWatch.LogGroup ApiLogGroup { get; init; }
15:         public required Aws.Xray.Group XrayGroup { get; init; }
16:     }
17: 
18:     public static Result Create(StackConfig cfg, Database.Result db, Messaging.Result msg)
19:     {
20:         // ── CloudWatch log groups ──
21:         var apiLogGroup = new Aws.CloudWatch.LogGroup(
22:             "telehealth-api-logs",
23:             new Aws.CloudWatch.LogGroupArgs
24:             {
25:                 Name = $"/telehealth/{cfg.StackName}/api",
26:                 RetentionInDays = 30,
27:                 Tags = cfg.Tags,
28:             }
29:         );
30: 
31:         // NOTE: RDS log groups (/aws/rds/instance/{id}/postgresql, /aws/rds/instance/{id}/upgrade)
32:         // are auto-created by AWS when EnabledCloudwatchLogsExports is set on the RDS instance.
33:         // Do not create them here — it would conflict with the AWS-managed groups.
34: 
35:         // ── Metric alarms — route to SNS ──
36: 
37:         // RDS CPU > 80% for 10 minutes
38:         _ = new Aws.CloudWatch.MetricAlarm(
39:             "rds-high-cpu",
40:             new Aws.CloudWatch.MetricAlarmArgs
41:             {
42:                 ComparisonOperator = "GreaterThanThreshold",
43:                 EvaluationPeriods = 2,
44:                 MetricName = "CPUUtilization",
45:                 Namespace = "AWS/RDS",
46:                 Period = 300,
47:                 Statistic = "Average",
48:                 Threshold = 80,
49:                 AlarmDescription = "RDS CPU > 80% for 10 minutes",
50:                 Dimensions = new InputMap<string> { { "DBInstanceIdentifier", db.Instance.Id } },
51:                 AlarmActions = { msg.OpsAlertsTopic.Arn },
52:                 OkActions = { msg.OpsAlertsTopic.Arn },
53:                 Tags = cfg.Tags,
54:             }
55:         );
56: 
57:         // RDS free storage < 2 GiB
58:         _ = new Aws.CloudWatch.MetricAlarm(
59:             "rds-low-storage",
60:             new Aws.CloudWatch.MetricAlarmArgs
61:             {
62:                 ComparisonOperator = "LessThanThreshold",
63:                 EvaluationPeriods = 1,
64:                 MetricName = "FreeStorageSpace",
65:                 Namespace = "AWS/RDS",
66:                 Period = 300,
67:                 Statistic = "Average",
68:                 Threshold = 2_147_483_648, // 2 GiB in bytes
69:                 AlarmDescription = "RDS free storage below 2 GiB",
70:                 Dimensions = new InputMap<string> { { "DBInstanceIdentifier", db.Instance.Id } },
71:                 AlarmActions = { msg.OpsAlertsTopic.Arn },
72:                 OkActions = { msg.OpsAlertsTopic.Arn },
73:                 Tags = cfg.Tags,
74:             }
75:         );
76: 
77:         // ── X-Ray — tracing group + sampling rule ──
78:         _ = new Aws.Xray.SamplingRule(
79:             "telehealth-sampling-rule",
80:             new Aws.Xray.SamplingRuleArgs
81:             {
82:                 RuleName = "telehealth-api-sampling",
83:                 Priority = 9000,
84:                 ReservoirSize = 5, // Always sample 5 req/s regardless of fixed rate
85:                 FixedRate = 0.10, // Sample 10% of remaining requests
86:                 UrlPath = "/api/*",
87:                 Host = "*",
88:                 HttpMethod = "*",
89:                 ServiceName = "telehealth-api",
90:                 ServiceType = "*",
91:                 ResourceArn = "*",
92:                 Version = 1,
93:                 Tags = cfg.Tags,
94:             },
95:             new CustomResourceOptions { ImportId = "telehealth-api-sampling" }
96:         );
97: 
98:         var xrayGroup = new Aws.Xray.Group(
99:             "telehealth-xray-group",
100:             new Aws.Xray.GroupArgs
101:             {
102:                 GroupName = $"telehealth-api-{cfg.StackName}",
103:                 FilterExpression = "service(\"telehealth-api\")",
104:                 InsightsConfiguration = new Aws.Xray.Inputs.GroupInsightsConfigurationArgs
105:                 {
106:                     InsightsEnabled = true,
107:                     NotificationsEnabled = false,
108:                 },
109:                 Tags = cfg.Tags,
110:             },
111:             new CustomResourceOptions { Id = "telehealth-api" }
112:         );
113: 
114:         return new Result { ApiLogGroup = apiLogGroup, XrayGroup = xrayGroup };
115:     }
116: }

(End of file - total 116 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Compute.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Compute.cs</path>
<type>file</type>
<content>
1: namespace TeleHealth.Infra;
2: 
3: using Pulumi;
4: using Aws = Pulumi.Aws;
5: 
6: /// <summary>
7: /// ECR repository, IAM role with scoped policies, instance profile,
8: /// and Elastic Beanstalk application + environment.
9: ///
10: /// IAM follows least-privilege: only managed policies for broad AWS
11: /// service integration (EB Web Tier, ECR read, X-Ray), with scoped
12: /// inline policies for SQS, SNS, CloudWatch Logs, S3, and Secrets Manager.
13: /// </summary>
14: public static class Compute
15: {
16:     public sealed class Result
17:     {
18:         public required Aws.Ecr.Repository EcrRepo { get; init; }
19:         public required Aws.ElasticBeanstalk.Application EbApp { get; init; }
20:         public required Aws.ElasticBeanstalk.Environment EbEnv { get; init; }
21:     }
22: 
23:     public static Result Create(
24:         StackConfig cfg,
25:         Networking.Result net,
26:         Storage.Result storage,
27:         Database.Result db,
28:         Messaging.Result msg,
29:         Observability.Result obs
30:     )
31:     {
32:         // ── ECR — Docker image registry ──
33:         var ecrRepo = new Aws.Ecr.Repository(
34:             "telehealth-api-repo",
35:             new Aws.Ecr.RepositoryArgs
36:             {
37:                 Name = $"telehealth-api-{cfg.StackName}",
38:                 ImageTagMutability = "MUTABLE",
39:                 ImageScanningConfiguration =
40:                     new Aws.Ecr.Inputs.RepositoryImageScanningConfigurationArgs
41:                     {
42:                         ScanOnPush = true,
43:                     },
44:                 Tags = cfg.Tags,
45:             }
46:         );
47: 
48:         _ = new Aws.Ecr.LifecyclePolicy(
49:             "telehealth-api-lifecycle",
50:             new Aws.Ecr.LifecyclePolicyArgs
51:             {
52:                 Repository = ecrRepo.Name,
53:                 Policy =
54:                     @"{
55:                     ""rules"": [
56:                         {
57:                             ""rulePriority"": 1,
58:                             ""description"": ""Remove untagged images after 1 day"",
59:                             ""selection"": { ""tagStatus"": ""untagged"", ""countType"": ""sinceImagePushed"", ""countUnit"": ""days"", ""countNumber"": 1 },
60:                             ""action"": { ""type"": ""expire"" }
61:                         },
62:                         {
63:                             ""rulePriority"": 2,
64:                             ""description"": ""Keep last 10 tagged images"",
65:                             ""selection"": { ""tagStatus"": ""any"", ""countType"": ""imageCountMoreThan"", ""countNumber"": 10 },
66:                             ""action"": { ""type"": ""expire"" }
67:                         }
68:                     ]
69:                 }",
70:             }
71:         );
72: 
73:         // ── IAM — EB EC2 instance role ──
74:         var ebRole = new Aws.Iam.Role(
75:             "eb-ec2-role",
76:             new Aws.Iam.RoleArgs
77:             {
78:                 AssumeRolePolicy =
79:                     @"{
80:                     ""Version"": ""2012-10-17"",
81:                     ""Statement"": [{
82:                         ""Action"": ""sts:AssumeRole"",
83:                         ""Principal"": { ""Service"": ""ec2.amazonaws.com"" },
84:                         ""Effect"": ""Allow""
85:                     }]
86:                 }",
87:                 Tags = cfg.Tags,
88:             }
89:         );
90: 
91:         // Managed policies — only for broad AWS-service integration
92:         foreach (
93:             var (suffix, policyArn) in new[]
94:             {
95:                 ("eb-web-tier", "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"),
96:                 ("eb-ecr-readonly", "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"),
97:                 ("eb-xray", "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"),
98:                 ("eb-ssm", "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"),
99:             }
100:         )
101:         {
102:             _ = new Aws.Iam.RolePolicyAttachment(
103:                 $"policy-{suffix}",
104:                 new Aws.Iam.RolePolicyAttachmentArgs { Role = ebRole.Name, PolicyArn = policyArn }
105:             );
106:         }
107: 
108:         // Scoped inline policy: SQS — processing queue + MassTransit queue management
109:         _ = new Aws.Iam.RolePolicy(
110:             "policy-sqs-scoped",
111:             new Aws.Iam.RolePolicyArgs
112:             {
113:                 Role = ebRole.Name,
114:                 Policy = msg.ProcessingQueue.Arn.Apply(queueArn =>
115:                     $@"{{
116:                         ""Version"": ""2012-10-17"",
117:                         ""Statement"": [
118:                             {{
119:                                 ""Sid"": ""ProcessingQueue"",
120:                                 ""Effect"": ""Allow"",
121:                                 ""Action"": [""sqs:SendMessage"",""sqs:ReceiveMessage"",""sqs:DeleteMessage"",""sqs:GetQueueAttributes""],
122:                                 ""Resource"": ""{queueArn}""
123:                             }},
124:                             {{
125:                                 ""Sid"": ""MassTransitSqsManagement"",
126:                                 ""Effect"": ""Allow"",
127:                                 ""Action"": [
128:                                     ""sqs:CreateQueue"",
129:                                     ""sqs:DeleteQueue"",
130:                                     ""sqs:GetQueueUrl"",
131:                                     ""sqs:GetQueueAttributes"",
132:                                     ""sqs:SetQueueAttributes"",
133:                                     ""sqs:PurgeQueue"",
134:                                     ""sqs:ListQueues"",
135:                                     ""sqs:SendMessage"",
136:                                     ""sqs:ReceiveMessage"",
137:                                     ""sqs:DeleteMessage""
138:                                 ],
139:                                 ""Resource"": ""arn:aws:sqs:{cfg.AwsRegion}:*:*""
140:                             }}
141:                         ]
142:                     }}"
143:                 ),
144:             }
145:         );
146: 
147:         // Scoped inline policy: SNS — publish + MassTransit topic management
148:         _ = new Aws.Iam.RolePolicy(
149:             "policy-sns-scoped",
150:             new Aws.Iam.RolePolicyArgs
151:             {
152:                 Role = ebRole.Name,
153:                 Policy = msg.MedicalAlertsTopic.Arn.Apply(topicArn =>
154:                     $@"{{
155:                         ""Version"": ""2012-10-17"",
156:                         ""Statement"": [
157:                             {{
158:                                 ""Sid"": ""MedicalAlertsTopic"",
159:                                 ""Effect"": ""Allow"",
160:                                 ""Action"": [""sns:Publish""],
161:                                 ""Resource"": ""{topicArn}""
162:                             }},
163:                             {{
164:                                 ""Sid"": ""MassTransitSnsManagement"",
165:                                 ""Effect"": ""Allow"",
166:                                 ""Action"": [
167:                                     ""sns:CreateTopic"",
168:                                     ""sns:DeleteTopic"",
169:                                     ""sns:GetTopicAttributes"",
170:                                     ""sns:SetTopicAttributes"",
171:                                     ""sns:ListTopics"",
172:                                     ""sns:Subscribe"",
173:                                     ""sns:Unsubscribe"",
174:                                     ""sns:Publish""
175:                                 ],
176:                                 ""Resource"": ""arn:aws:sns:{cfg.AwsRegion}:*:*""
177:                             }}
178:                         ]
179:                     }}"
180:                 ),
181:             }
182:         );
183: 
184:         // Scoped inline policy: CloudWatch Logs — only the API log group
185:         _ = new Aws.Iam.RolePolicy(
186:             "policy-cloudwatch-logs-scoped",
187:             new Aws.Iam.RolePolicyArgs
188:             {
189:                 Role = ebRole.Name,
190:                 Policy = obs.ApiLogGroup.Arn.Apply(logGroupArn =>
191:                     $@"{{
192:                         ""Version"": ""2012-10-17"",
193:                         ""Statement"": [{{
194:                             ""Effect"": ""Allow"",
195:                             ""Action"": [""logs:CreateLogStream"",""logs:PutLogEvents"",""logs:DescribeLogStreams""],
196:                             ""Resource"": [""{logGroupArn}"",""{logGroupArn}:*""]
197:                         }}]
198:                     }}"
199:                 ),
200:             }
201:         );
202: 
203:         // Scoped inline policy: S3 — only the lab-reports bucket
204:         _ = new Aws.Iam.RolePolicy(
205:             "policy-s3-lab-reports",
206:             new Aws.Iam.RolePolicyArgs
207:             {
208:                 Role = ebRole.Name,
209:                 Policy = storage.LabReportsBucket.Arn.Apply(arn =>
210:                     $@"{{
211:                         ""Version"": ""2012-10-17"",
212:                         ""Statement"": [{{
213:                             ""Effect"": ""Allow"",
214:                             ""Action"": [""s3:PutObject"",""s3:GetObject"",""s3:DeleteObject"",""s3:ListBucket""],
215:                             ""Resource"": [""{arn}"",""{arn}/*""]
216:                         }}]
217:                     }}"
218:                 ),
219:             }
220:         );
221: 
222:         // Scoped inline policy: Secrets Manager — only the DB secret
223:         _ = new Aws.Iam.RolePolicy(
224:             "policy-secrets-manager",
225:             new Aws.Iam.RolePolicyArgs
226:             {
227:                 Role = ebRole.Name,
228:                 Policy = db.DbSecret.Arn.Apply(arn =>
229:                     $@"{{
230:                         ""Version"": ""2012-10-17"",
231:                         ""Statement"": [{{
232:                             ""Effect"": ""Allow"",
233:                             ""Action"": [""secretsmanager:GetSecretValue""],
234:                             ""Resource"": ""{arn}""
235:                         }}]
236:                     }}"
237:                 ),
238:             }
239:         );
240: 
241:         // Scoped inline policy: SES send email for appointment reminder feature
242:         _ = new Aws.Iam.RolePolicy(
243:             "policy-ses-scoped",
244:             new Aws.Iam.RolePolicyArgs
245:             {
246:                 Role = ebRole.Name,
247:                 Policy =
248:                     @"{
249:                         ""Version"": ""2012-10-17"",
250:                         ""Statement"": [{
251:                             ""Effect"": ""Allow"",
252:                             ""Action"": [""ses:SendEmail"", ""ses:SendRawEmail""],
253:                             ""Resource"": ""*""
254:                         }]
255:                     }",
256:             }
257:         );
258: 
259:         var instanceProfile = new Aws.Iam.InstanceProfile(
260:             "eb-instance-profile",
261:             new Aws.Iam.InstanceProfileArgs { Role = ebRole.Name }
262:         );
263: 
264:         // ── Elastic Beanstalk ──
265:         var ebApp = new Aws.ElasticBeanstalk.Application(
266:             "telehealth-api",
267:             new Aws.ElasticBeanstalk.ApplicationArgs { Tags = cfg.Tags }
268:         );
269: 
270:         var ebEnv = new Aws.ElasticBeanstalk.Environment(
271:             "telehealth-env",
272:             new Aws.ElasticBeanstalk.EnvironmentArgs
273:             {
274:                 Application = ebApp.Name,
275:                 SolutionStackName = "64bit Amazon Linux 2023 v4.12.1 running Docker",
276:                 Settings = new[]
277:                 {
278:                     // -- Instance & networking --
279:                     EbSetting(
280:                         "aws:autoscaling:launchconfiguration",
281:                         "IamInstanceProfile",
282:                         instanceProfile.Name
283:                     ),
284:                     EbSetting("aws:autoscaling:launchconfiguration", "InstanceType", "t3.micro"),
285:                     EbSetting(
286:                         "aws:autoscaling:launchconfiguration",
287:                         "SecurityGroups",
288:                         net.EbSecurityGroup.Id
289:                     ),
290:                     EbSetting(
291:                         "aws:elasticbeanstalk:environment",
292:                         "EnvironmentType",
293:                         "SingleInstance"
294:                     ),
295:                     // -- CloudWatch log streaming --
296:                     EbSetting("aws:elasticbeanstalk:cloudwatch:logs", "StreamLogs", "true"),
297:                     EbSetting("aws:elasticbeanstalk:cloudwatch:logs", "DeleteOnTerminate", "false"),
298:                     EbSetting("aws:elasticbeanstalk:cloudwatch:logs", "RetentionInDays", "30"),
299:                     // -- X-Ray daemon --
300:                     EbSetting("aws:elasticbeanstalk:xray", "XRayEnabled", "true"),
301:                     // -- App environment variables --
302:                     EbEnvVar("ASPNETCORE_ENVIRONMENT", "Production"),
303:                     EbEnvVar("ASPNETCORE_HTTP_PORTS", "8080"),
304:                     EbEnvVar(
305:                         "Cors__AllowedOrigins",
306:                         storage.FrontendBucket.WebsiteEndpoint.Apply(ep =>
307:                             $"http://{ep},https://www.telehealth.foo,https://telehealth.foo"
308:                         )
309:                     ),
310:                     // DB connection — full Npgsql connection string for ASP.NET Core
311:                     EbEnvVar(
312:                         "ConnectionStrings__Database",
313:                         Output
314:                             .Tuple(db.Instance.Address, cfg.DbPassword)
315:                             .Apply(t =>
316:                                 $"Host={t.Item1};Port=5432;Database={cfg.DbName};Username={cfg.DbUsername};Password={t.Item2};SSL Mode=Prefer"
317:                             )
318:                     ),
319:                     EbEnvVar("DB_SECRET_ARN", db.DbSecret.Arn),
320:                     // AWS service references
321:                     EbEnvVar("AWS_REGION", cfg.AwsRegion),
322:                     EbEnvVar("AWS_S3_LAB_REPORTS_BUCKET", storage.LabReportsBucket.BucketName),
323:                     EbEnvVar("AWS_SNS_TOPIC_ARN", msg.MedicalAlertsTopic.Arn),
324:                     EbEnvVar("AWS_SQS_QUEUE_URL", msg.ProcessingQueue.Id),
325:                     EbEnvVar("SES_SENDER_EMAIL", "hongjx0321@gmail.com"),
326:                     EbEnvVar("SES_REGION", "us-east-1"),
327:                     // JWT authentication
328:                     EbEnvVar("Jwt__Secret", cfg.JwtSecret),
329:                     EbEnvVar("Jwt__Issuer", "telehealth-api"),
330:                     EbEnvVar("Jwt__Audience", "telehealth-web"),
331:                     EbEnvVar("Jwt__ExpiryMinutes", "60"),
332:                     // -- VPC placement --
333:                     EbSetting("aws:ec2:vpc", "VPCId", net.VpcId),
334:                     EbSetting(
335:                         "aws:ec2:vpc",
336:                         "Subnets",
337:                         net.SubnetIds.Apply(ids => string.Join(",", ids))
338:                     ),
339:                 },
340:                 Tags = cfg.Tags,
341:             }
342:         );
343: 
344:         return new Result
345:         {
346:             EcrRepo = ecrRepo,
347:             EbApp = ebApp,
348:             EbEnv = ebEnv,
349:         };
350:     }
351: 
352:     // Helper to reduce EB setting boilerplate
353:     private static Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs EbSetting(
354:         string ns,
355:         string name,
356:         Input<string> value
357:     ) =>
358:         new()
359:         {
360:             Namespace = ns,
361:             Name = name,
362:             Value = value,
363:         };
364: 
365:     private static Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs EbEnvVar(
366:         string name,
367:         Input<string> value
368:     ) => EbSetting("aws:elasticbeanstalk:application:environment", name, value);
369: }

(End of file - total 369 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Serverless.cs"
}
```

**Output:**
```
<path>/Users/vincent-sequoia/Projects/APU/DDAC/telehealth-portal/infra/Serverless.cs</path>
<type>file</type>
<content>
1: namespace TeleHealth.Infra;
2: 
3: using Pulumi;
4: using Aws = Pulumi.Aws;
5: 
6: /// <summary>
7: /// Lambda function for processing lab report PDFs.
8: /// Triggered by SQS messages from the lab-report processing queue.
9: ///
10: /// Fixes applied:
11: ///   - Runtime: dotnet10 (managed .NET 10 runtime, GA since Jan 2026)
12: ///   - Scoped S3 read permission for lab reports bucket
13: ///   - ReservedConcurrentExecutions to prevent overwhelming RDS
14: ///   - Dummy zip placeholder for initial Pulumi creation (CI/CD overwrites)
15: /// </summary>
16: public static class Serverless
17: {
18:     public sealed class Result
19:     {
20:         public required Aws.Lambda.Function PdfProcessorLambda { get; init; }
21:         public required Aws.Lambda.Function ReminderLambda { get; init; }
22:         public required Aws.Lambda.Function NotificationsLambda { get; init; }
23:     }
24: 
25:     public static Result Create(StackConfig cfg, Messaging.Result msg, Storage.Result storage)
26:     {
27:         // ── IAM role for Lambda ──
28:         var lambdaRole = new Aws.Iam.Role(
29:             "lambda-pdf-processor-role",
30:             new Aws.Iam.RoleArgs
31:             {
32:                 AssumeRolePolicy =
33:                     @"{
34:                     ""Version"": ""2012-10-17"",
35:                     ""Statement"": [{
36:                         ""Action"": ""sts:AssumeRole"",
37:                         ""Principal"": { ""Service"": ""lambda.amazonaws.com"" },
38:                         ""Effect"": ""Allow""
39:                     }]
40:                 }",
41:                 Tags = cfg.Tags,
42:             }
43:         );
44: 
45:         // Managed policies: basic execution (CloudWatch Logs) + SQS polling
46:         _ = new Aws.Iam.RolePolicyAttachment(
47:             "lambda-basic-execution",
48:             new Aws.Iam.RolePolicyAttachmentArgs
49:             {
50:                 Role = lambdaRole.Name,
51:                 PolicyArn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
52:             }
53:         );
54: 
55:         _ = new Aws.Iam.RolePolicyAttachment(
56:             "lambda-sqs-execution",
57:             new Aws.Iam.RolePolicyAttachmentArgs
58:             {
59:                 Role = lambdaRole.Name,
60:                 PolicyArn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole",
61:             }
62:         );
63: 
64:         // Scoped inline policy: S3 read access for lab reports bucket only
65:         _ = new Aws.Iam.RolePolicy(
66:             "lambda-s3-lab-reports",
67:             new Aws.Iam.RolePolicyArgs
68:             {
69:                 Role = lambdaRole.Name,
70:                 Policy = storage.LabReportsBucket.Arn.Apply(arn =>
71:                     $@"{{
72:                         ""Version"": ""2012-10-17"",
73:                         ""Statement"": [{{
74:                             ""Effect"": ""Allow"",
75:                             ""Action"": [""s3:GetObject""],
76:                             ""Resource"": ""{arn}/*""
77:                         }}]
78:                     }}"
79:                 ),
80:             }
81:         );
82: 
83:         // ── Lambda function ──
84:         var pdfProcessorLambda = new Aws.Lambda.Function(
85:             "lab-pdf-processor",
86:             new Aws.Lambda.FunctionArgs
87:             {
88:                 Name = $"telehealth-lab-pdf-processor-{cfg.StackName}",
89:                 Role = lambdaRole.Arn,
90:                 Runtime = "dotnet10",
91:                 Handler =
92:                     "LabPdfProcessor-dev-ProcessPdfDocument::LabPdfProcessor_dev_ProcessPdfDocument.Function::FunctionHandler",
93:                 MemorySize = 256,
94:                 Timeout = 30,
95: 
96:                 // Removed ReservedConcurrentExecutions — account lacks headroom.
97:                 // Use RDS Proxy or connection pooling to protect the database instead.
98:                 // ReservedConcurrentExecutions = 5,
99: 
100:                 // Dummy deployment package — CI/CD overwrites with the real build.
101:                 // This file must exist for Pulumi to create the Lambda resource.
102:                 Code = new FileArchive("./dummy-lambda"),
103: 
104:                 Environment = new Aws.Lambda.Inputs.FunctionEnvironmentArgs
105:                 {
106:                     Variables = new InputMap<string>
107:                     {
108:                         { "ENVIRONMENT", cfg.StackName },
109:                         { "S3_LAB_REPORTS_BUCKET", storage.LabReportsBucket.BucketName },
110:                     },
111:                 },
112:                 Tags = cfg.Tags,
113:             },
114:             // Ignore code changes — CI/CD (Job 4) deploys the real artifact via
115:             // `aws lambda update-function-code`. Without this, every `pulumi up`
116:             // would revert the deployed code back to the dummy placeholder.
117:             new CustomResourceOptions { IgnoreChanges = { "sourceCodeHash" } }
118:         );
119: 
120:         // ── SQS event source mapping (triggers Lambda from the processing queue) ──
121:         // ReportBatchItemFailures enables partial batch reporting: only failed
122:         // messages are retried, not the entire batch. Requires the Lambda handler
123:         // to return SQSBatchResponse with failed message IDs.
124:         _ = new Aws.Lambda.EventSourceMapping(
125:             "sqs-to-lambda-mapping",
126:             new Aws.Lambda.EventSourceMappingArgs
127:             {
128:                 EventSourceArn = msg.ProcessingQueue.Arn,
129:                 FunctionName = pdfProcessorLambda.Arn,
130:                 BatchSize = 10,
131:                 Enabled = true,
132:                 FunctionResponseTypes = { "ReportBatchItemFailures" },
133:             },
134:             new CustomResourceOptions
135:             {
136:                 DependsOn = { pdfProcessorLambda },
137:                 DeleteBeforeReplace = true,
138:             }
139:         );
140: 
141:         // ── IAM role for Appointment Reminder Lambda ──
142:         var reminderRole = new Aws.Iam.Role(
143:             "lambda-reminder-role",
144:             new Aws.Iam.RoleArgs
145:             {
146:                 AssumeRolePolicy =
147:                     @"{
148:                     ""Version"": ""2012-10-17"",
149:                     ""Statement"": [{
150:                         ""Action"": ""sts:AssumeRole"",
151:                         ""Principal"": { ""Service"": ""lambda.amazonaws.com"" },
152:                         ""Effect"": ""Allow""
153:                     }]
154:                 }",
155:                 Tags = cfg.Tags,
156:             }
157:         );
158: 
159:         _ = new Aws.Iam.RolePolicyAttachment(
160:             "reminder-basic-execution",
161:             new Aws.Iam.RolePolicyAttachmentArgs
162:             {
163:                 Role = reminderRole.Name,
164:                 PolicyArn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
165:             }
166:         );
167: 
168:         // Scoped SES send permission
169:         _ = new Aws.Iam.RolePolicy(
170:             "reminder-ses-send",
171:             new Aws.Iam.RolePolicyArgs
172:             {
173:                 Role = reminderRole.Name,
174:                 Policy =
175:                     @"{
176:                         ""Version"": ""2012-10-17"",
177:                         ""Statement"": [{
178:                             ""Effect"": ""Allow"",
179:                             ""Action"": [""ses:SendEmail"", ""ses:SendRawEmail""],
180:                             ""Resource"": ""*""
181:                         }]
182:                     }",
183:             }
184:         );
185: 
186:         // ── Appointment Reminder Lambda (triggered directly by SNS) ──
187:         var reminderLambda = new Aws.Lambda.Function(
188:             "appointment-reminder",
189:             new Aws.Lambda.FunctionArgs
190:             {
191:                 Name = $"telehealth-appointment-reminder-{cfg.StackName}",
192:                 Role = reminderRole.Arn,
193:                 Runtime = "dotnet10",
194:                 Handler =
195:                     "AppointmentReminder-dev-SentReminder::AppointmentReminder_dev_SentReminder.Function::FunctionHandler",
196:                 MemorySize = 256,
197:                 Timeout = 60,
198:                 Code = new FileArchive("./dummy-lambda"),
199:                 Environment = new Aws.Lambda.Inputs.FunctionEnvironmentArgs
200:                 {
201:                     Variables = new InputMap<string>
202:                     {
203:                         { "ENVIRONMENT", cfg.StackName },
204:                         { "SES_SENDER_EMAIL", "hongjx0321@gmail.com" },
205:                         { "SES_REGION", "us-east-1" },
206:                     },
207:                 },
208:                 Tags = cfg.Tags,
209:             },
210:             new CustomResourceOptions { IgnoreChanges = { "sourceCodeHash" } }
211:         );
212: 
213:         // Allow SNS to invoke the Lambda directly
214:         _ = new Aws.Lambda.Permission(
215:             "reminder-sns-invoke",
216:             new Aws.Lambda.PermissionArgs
217:             {
218:                 Action = "lambda:InvokeFunction",
219:                 Function = reminderLambda.Arn,
220:                 Principal = "sns.amazonaws.com",
221:                 SourceArn = msg.AppointmentBookedTopic.Arn,
222:             }
223:         );
224: 
225:         // Subscribe Lambda directly to the AppointmentBookedEvent SNS topic
226:         _ = new Aws.Sns.TopicSubscription(
227:             "reminder-sns-sub",
228:             new Aws.Sns.TopicSubscriptionArgs
229:             {
230:                 Topic = msg.AppointmentBookedTopic.Arn,
231:                 Protocol = "lambda",
232:                 Endpoint = reminderLambda.Arn,
233:             }
234:         );
235: 
236:         // ── IAM role for Appointment Notifications Lambda ──
237:         var notificationsRole = new Aws.Iam.Role(
238:             "lambda-notifications-role",
239:             new Aws.Iam.RoleArgs
240:             {
241:                 AssumeRolePolicy =
242:                     @"{
243:                     ""Version"": ""2012-10-17"",
244:                     ""Statement"": [{
245:                         ""Action"": ""sts:AssumeRole"",
246:                         ""Principal"": { ""Service"": ""lambda.amazonaws.com"" },
247:                         ""Effect"": ""Allow""
248:                     }]
249:                 }",
250:                 Tags = cfg.Tags,
251:             }
252:         );
253: 
254:         _ = new Aws.Iam.RolePolicyAttachment(
255:             "notifications-basic-execution",
256:             new Aws.Iam.RolePolicyAttachmentArgs
257:             {
258:                 Role = notificationsRole.Name,
259:                 PolicyArn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
260:             }
261:         );
262: 
263:         _ = new Aws.Iam.RolePolicy(
264:             "notifications-ses-send",
265:             new Aws.Iam.RolePolicyArgs
266:             {
267:                 Role = notificationsRole.Name,
268:                 Policy =
269:                     @"{
270:                         ""Version"": ""2012-10-17"",
271:                         ""Statement"": [{
272:                             ""Effect"": ""Allow"",
273:                             ""Action"": [""ses:SendEmail"", ""ses:SendRawEmail""],
274:                             ""Resource"": ""*""
275:                         }]
276:                     }",
277:             }
278:         );
279: 
280:         // ── Appointment Notifications Lambda (cancelled + rescheduled) ──
281:         var notificationsLambda = new Aws.Lambda.Function(
282:             "appointment-notifications",
283:             new Aws.Lambda.FunctionArgs
284:             {
285:                 Name = $"telehealth-appointment-notifications-{cfg.StackName}",
286:                 Role = notificationsRole.Arn,
287:                 Runtime = "dotnet10",
288:                 Handler =
289:                     "AppointmentNotifications::AppointmentNotifications.Function::FunctionHandler",
290:                 MemorySize = 256,
291:                 Timeout = 60,
292:                 Code = new FileArchive("./dummy-lambda"),
293:                 Environment = new Aws.Lambda.Inputs.FunctionEnvironmentArgs
294:                 {
295:                     Variables = new InputMap<string>
296:                     {
297:                         { "ENVIRONMENT", cfg.StackName },
298:                         { "SES_SENDER_EMAIL", "hongjx0321@gmail.com" },
299:                         { "SES_REGION", "us-east-1" },
300:                     },
301:                 },
302:                 Tags = cfg.Tags,
303:             },
304:             new CustomResourceOptions { IgnoreChanges = { "sourceCodeHash" } }
305:         );
306: 
307:         _ = new Aws.Lambda.Permission(
308:             "notifications-cancelled-sns-invoke",
309:             new Aws.Lambda.PermissionArgs
310:             {
311:                 Action = "lambda:InvokeFunction",
312:                 Function = notificationsLambda.Arn,
313:                 Principal = "sns.amazonaws.com",
314:                 SourceArn = msg.AppointmentCancelledTopic.Arn,
315:             }
316:         );
317: 
318:         _ = new Aws.Lambda.Permission(
319:             "notifications-rescheduled-sns-invoke",
320:             new Aws.Lambda.PermissionArgs
321:             {
322:                 Action = "lambda:InvokeFunction",
323:                 Function = notificationsLambda.Arn,
324:                 Principal = "sns.amazonaws.com",
325:                 SourceArn = msg.AppointmentRescheduledTopic.Arn,
326:             }
327:         );
328: 
329:         _ = new Aws.Sns.TopicSubscription(
330:             "notifications-cancelled-sns-sub",
331:             new Aws.Sns.TopicSubscriptionArgs
332:             {
333:                 Topic = msg.AppointmentCancelledTopic.Arn,
334:                 Protocol = "lambda",
335:                 Endpoint = notificationsLambda.Arn,
336:             }
337:         );
338: 
339:         _ = new Aws.Sns.TopicSubscription(
340:             "notifications-rescheduled-sns-sub",
341:             new Aws.Sns.TopicSubscriptionArgs
342:             {
343:                 Topic = msg.AppointmentRescheduledTopic.Arn,
344:                 Protocol = "lambda",
345:                 Endpoint = notificationsLambda.Arn,
346:             }
347:         );
348: 
349:         return new Result
350:         {
351:             PdfProcessorLambda = pdfProcessorLambda,
352:             ReminderLambda = reminderLambda,
353:             NotificationsLambda = notificationsLambda,
354:         };
355:     }
356: }

(End of file - total 356 lines)
</content>
```

---

## Assistant (Plan · Kimi K2.6 · 114.1s)

_Thinking:_

Now I have all the files. I need to explain each resource file in detail, as a beginner. I'll go file by file, explaining:

1. The overall purpose (analogy)
2. The C# syntax (classes, static, sealed, Output<T>, etc.)
3. Each resource created and what it does in AWS terms
4. Key lines and what they mean
5. How they connect to each other

Let me structure this clearly.

Here is a detailed, beginner-friendly walkthrough of every file in the `infra/` directory. I'll explain **both the C# code syntax** and **what each AWS resource actually does** in the real world.

---

# 📁 The `infra/` Directory — Your Cloud Blueprint

Think of the `infra/` folder as a **blueprint factory**. Each file is a specialist architect who designs one part of your cloud building. `Program.cs` is the **site manager** who tells each architect what to build and in what order.

---

## 1. 🔧 `Config.cs` — The Settings Notebook

**Real-world analogy:** Before construction starts, the foreman pulls out a notebook that has all the specs: "Build a small house," "Use this password," "Paint it blue." This file is that notebook.

### The Code Structure

```csharp
namespace TeleHealth.Infra;
using Pulumi;
```
- `namespace` = A **folder for code names**. It prevents confusion if two files have classes with the same name.
- `using Pulumi;` = Imports the Pulumi toolbox so we can use its special types.

```csharp
public sealed class StackConfig
```
- `public` = Anyone can use this class.
- `sealed` = "No one is allowed to inherit from this." It keeps things simple.
- `class StackConfig` = A **template for an object** that holds configuration values.

### The Properties (The Variables Inside)

```csharp
public Output<string> DbPassword { get; }
```
- `Output<string>` = A Pulumi-specific wrapper. In the cloud, some values (like a generated database password) aren't known until **after** the resource is created. `Output<string>` means: *"I'll have the value eventually, but you can pass me around before I do."*
- `{ get; }` = A **read-only property**. Once set in the constructor, it can't be changed.

```csharp
public string DbInstanceClass { get; }
```
- Just a normal string (e.g., `"db.t3.micro"`). No `Output<>` wrapper because this is known immediately — it's in the config file.

```csharp
public InputMap<string> Tags { get; }
```
- `InputMap<string>` = A dictionary (word → definition) where Pulumi can handle values that aren't ready yet. Used to tag AWS resources so you can see costs by project in the AWS billing console.

### The Constructor (Where Everything Is Set Up)

```csharp
public StackConfig()
{
    var config = new Config("telehealth");
```
- `new Config("telehealth")` = Reads from Pulumi's config file (`Pulumi.prod.yaml`). It looks for keys that start with `telehealth:`.

```csharp
    DbPassword = config.RequireSecret("dbPassword");
```
- `RequireSecret` = **Mandatory value**. If you forget to set it, Pulumi crashes and tells you. The `Secret` part means Pulumi encrypts it and never shows it in plain text in logs.

```csharp
    DbInstanceClass = config.Get("dbInstanceClass") ?? "db.t3.micro";
```
- `config.Get` = **Optional value**. If it's not in the config file, use the default after `??`.
- `??` = C#'s **null-coalescing operator** — "If the left side is empty, use the right side instead."

```csharp
    StackName = Deployment.Instance.StackName;
```
- Every Pulumi deployment has a **stack name** (e.g., `prod`, `dev`). This reads it so you can name resources uniquely per environment.

```csharp
    Tags = new InputMap<string>
    {
        { "Project", "TeleHealth-DDAC" },
        { "ManagedBy", "Pulumi" },
        { "Environment", StackName },
    };
```
- Creates the tag dictionary. Every AWS resource will get these three labels so you can sort your AWS bill by project and environment.

---

## 2. 🌐 `Networking.cs` — The Fence and Gates

**Real-world analogy:** Before you put a house on land, you need to know where the property lines are, build the driveway, and install a gate. In the cloud, this is your **VPC** (Virtual Private Cloud) — your private property on AWS's land.

### Key C# Concepts Here

```csharp
private static readonly string[] AvailabilityZones =
[
    "us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d", "us-east-1f",
];
```
- `private static readonly` = A list that belongs to the class (not any specific object) and can never change after it's created. These are the **data centers** in Northern Virginia where your stuff will live.

```csharp
public sealed class Result
{
    public required Output<string> VpcId { get; init; }
```
- `Result` = A **container** that holds everything this file creates, so other files can reference it.
- `required` = C# 11 feature: you **must** set this property when creating the object, or the compiler yells at you.
- `init;` = You can only set this property during object creation, never after.

### The Resources Created

#### `GetVpc.Invoke` — Finding Your Land

```csharp
var defaultVpc = Aws.Ec2.GetVpc.Invoke(new Aws.Ec2.GetVpcInvokeArgs { Default = true });
```
- Instead of **creating** a new VPC (expensive, complex), this **looks up** the default VPC that AWS gives every account. It's like using an existing neighborhood instead of building a new one.

#### `GetSubnets.Invoke` — Finding the Streets

```csharp
var defaultSubnets = Aws.Ec2.GetSubnets.Invoke(
    new Aws.Ec2.GetSubnetsInvokeArgs
    {
        Filters = new[]
        {
            new Aws.Ec2.Inputs.GetSubnetsFilterInputArgs
            {
                Name = "vpc-id",
                Values = new[] { defaultVpc.Apply(v => v.Id) },
            },
```
- `Filters` = "Only give me subnets that match these rules."
- `defaultVpc.Apply(v => v.Id)` = "Once we know the VPC's ID, use it here." This is how Pulumi handles values that aren't ready yet.
- `AvailabilityZones` = Only grab subnets in those 5 specific data centers.

#### Security Group for Elastic Beanstalk (`eb-sg`) — The Front Gate

```csharp
var ebSecurityGroup = new Aws.Ec2.SecurityGroup(
    "eb-sg",
    new Aws.Ec2.SecurityGroupArgs
    {
        Ingress = new[]
        {
            new Aws.Ec2.Inputs.SecurityGroupIngressArgs
            {
                Protocol = "tcp",
                FromPort = 80,
                ToPort = 80,
                CidrBlocks = { "0.0.0.0/0" },
                Description = "HTTP from load balancer / internet",
            },
```
- `SecurityGroup` = A **firewall rule set** attached to your servers.
- `Ingress` = "Who is allowed **in**?"
- `Protocol = "tcp"` = The type of traffic. HTTP uses TCP.
- `FromPort = 80, ToPort = 80` = Port 80 is the standard web (HTTP) port.
- `CidrBlocks = { "0.0.0.0/0" }` = **Anyone on the internet** can reach port 80. This is your public front door.
- `Egress` = "Who can the server talk **out to**?"
- `Protocol = "-1"` = **All protocols**. The server can talk to the internet freely to download updates, talk to the database, etc.

#### Security Group for RDS Database (`db-sg`) — The Back Door

```csharp
var dbSecurityGroup = new Aws.Ec2.SecurityGroup(
    "db-sg",
    new Aws.Ec2.SecurityGroupArgs
    {
        Ingress = new[]
        {
            new Aws.Ec2.Inputs.SecurityGroupIngressArgs
            {
                Protocol = "tcp",
                FromPort = 5432,
                ToPort = 5432,
                SecurityGroups = { ebSecurityGroup.Id },
```
- **Port 5432** = PostgreSQL's special port.
- `SecurityGroups = { ebSecurityGroup.Id }` = **Only servers inside the EB security group** can enter. Not the internet. Not even your laptop directly.
- This is the key security feature: the database is invisible to the world except through your app server.

#### DB Subnet Group — Spreading Across Data Centers

```csharp
var dbSubnetGroup = new Aws.Rds.SubnetGroup(
    "telehealth-db-subnet-group",
    new Aws.Rds.SubnetGroupArgs
    {
        SubnetIds = defaultSubnets.Apply(s => s.Ids),
```
- A **subnet group** tells AWS: "Put the database in these specific neighborhoods (subnets)." This spreads it across multiple data centers for reliability. If one building loses power, the database fails over to another.

---

## 3. 💾 `Storage.cs` — The Filing Cabinets

**Real-world analogy:** You need three types of storage: a public display case (website files), a temporary workspace (deployment packages), and a locked vault (medical records).

### Resource 1: Frontend Bucket (Public Display Case)

```csharp
var frontendBucket = new Aws.S3.Bucket(
    "telehealth-frontend",
    new Aws.S3.BucketArgs { ForceDestroy = true, Tags = cfg.Tags }
);
```
- `Aws.S3.Bucket` = An AWS S3 bucket — a hard drive in the cloud.
- `ForceDestroy = true` = When you delete this infrastructure, **delete all files too**. Good for dev; dangerous for production (would erase patient data if applied to the wrong bucket).

```csharp
var frontendWebsiteConfig = new Aws.S3.BucketWebsiteConfiguration(...)
```
- Tells AWS: "This bucket isn't just storage — it's a **website**." When someone visits the bucket's URL, serve `index.html`.

```csharp
var frontendPublicAccessBlock = new Aws.S3.BucketPublicAccessBlock(...)
{
    BlockPublicAcls = false,
    BlockPublicPolicy = false,
    ...
}
```
- AWS blocks public access by default. This **explicitly allows** public access because the React app must be viewable by anyone.

```csharp
_ = new Aws.S3.BucketPolicy(...)
```
- The `_ =` means "I don't need to store a reference to this." The policy is a JSON document attached to the bucket saying: "Allow anyone to read (`GetObject`) files in this bucket."

### Resource 2: Artifacts Bucket (Temporary Workspace)

```csharp
var artifactsBucket = new Aws.S3.Bucket(
    "telehealth-eb-artifacts",
    new Aws.S3.BucketArgs { ForceDestroy = true, Tags = cfg.Tags }
);
```
- Stores `Dockerrun.aws.json` files — the "shipping labels" that tell Elastic Beanstalk which Docker image to run. `ForceDestroy = true` is fine because these are temporary.

### Resource 3: Lab Reports Bucket (Locked Vault)

```csharp
var labReportsBucket = new Aws.S3.Bucket(
    "telehealth-lab-reports",
    new Aws.S3.BucketArgs { Tags = cfg.Tags },
    new CustomResourceOptions { Protect = true }
);
```
- `Protect = true` = **AWS will refuse to delete this bucket** even if you run `pulumi destroy`. This prevents accidental deletion of patient medical files.

```csharp
_ = new Aws.S3.BucketCorsConfiguration(...)
```
- **CORS** = Cross-Origin Resource Sharing. The web browser in your React app needs permission to upload files directly to this bucket. This rule says: "If the request comes from the frontend website origin, allow it."

```csharp
_ = new Aws.S3.BucketPublicAccessBlock(...)
{
    BlockPublicAcls = true,
    BlockPublicPolicy = true,
    ...
}
```
- The **opposite** of the frontend bucket. **Block all public access.** Lab reports must never be publicly readable.

---

## 4. 📬 `Messaging.cs` — The Post Office

**Real-world analogy:** You need a broadcast system (SNS — Simple Notification Service) to shout messages to many listeners, and a holding line (SQS — Simple Queue Service) to store messages until someone processes them.

### SNS Topics (Broadcast Channels)

```csharp
var medicalAlertsTopic = new Aws.Sns.Topic(
    "medical-alerts-topic",
    new Aws.Sns.TopicArgs
    {
        KmsMasterKeyId = "alias/aws/sns",
```
- `Sns.Topic` = A **broadcast channel**. One sender, many receivers.
- `KmsMasterKeyId` = Encrypt messages with AWS's managed encryption key. Messages about patients must be encrypted.

There are **5 topics** total:
1. `medical-alerts-topic` — General medical alerts
2. `appointment-booked-topic` — Triggers reminder Lambda
3. `ops-alerts-topic` — Infrastructure alerts (CPU high, disk full)
4. `appointment-cancelled-topic` — Triggers notification Lambda
5. `appointment-rescheduled-topic` — Triggers notification Lambda

### SQS Queues (The Holding Lines)

```csharp
var deadLetterQueue = new Aws.Sqs.Queue(
    "report-processing-dlq",
    new Aws.Sqs.QueueArgs
    {
        SqsManagedSseEnabled = true,
        MessageRetentionSeconds = 1_209_600, // 14 days
```
- `SqsManagedSseEnabled = true` = Encrypt messages at rest.
- `MessageRetentionSeconds = 1_209_600` = Keep failed messages for 14 days so engineers can investigate why they failed.
- The `_` in `1_209_600` is just a readability separator — C# ignores it. It means 1,209,600 seconds.

```csharp
var processingQueue = new Aws.Sqs.Queue(
    "report-processing-queue",
    new Aws.Sqs.QueueArgs
    {
        VisibilityTimeoutSeconds = 360,
        RedrivePolicy = deadLetterQueue.Arn.Apply(dlqArn =>
            $@"{{""deadLetterTargetArn"":""{dlqArn}"",""maxReceiveCount"":3}}"
        ),
```
- `VisibilityTimeoutSeconds = 360` = When a Lambda takes a message, hide it from others for 6 minutes. If Lambda finishes, delete it. If Lambda crashes, make it visible again after 6 minutes.
- `RedrivePolicy` = After 3 failed attempts, move the message to the dead-letter queue instead of retrying forever.

```csharp
_ = new Aws.Sns.TopicSubscription(...)
{
    Topic = medicalAlertsTopic.Arn,
    Protocol = "sqs",
    Endpoint = processingQueue.Arn,
}
```
- Connects the SNS topic to the SQS queue. When something publishes to `medical-alerts-topic`, the message **automatically lands in the SQS queue**.

```csharp
_ = new Aws.Sqs.QueuePolicy(...)
```
- A JSON policy that explicitly allows the SNS service to send messages to this queue. Without this, AWS rejects the message for security.

---

## 5. 🗄️ `Database.cs` — The Vault

**Real-world analogy:** This file builds the bank vault (PostgreSQL database) and puts the combination (password) in a secure safe deposit box (Secrets Manager).

### Secrets Manager — The Safe Deposit Box

```csharp
var dbSecret = new Aws.SecretsManager.Secret(
    "telehealth-db-secret",
    new Aws.SecretsManager.SecretArgs
    {
        Name = $"telehealth/{cfg.StackName}/db-password",
        RecoveryWindowInDays = 0,
```
- `SecretsManager.Secret` = A **named envelope** in AWS that stores encrypted text.
- `RecoveryWindowInDays = 0` = Delete immediately if the infrastructure is torn down. For production, this should be `7` (you have 7 days to recover a deleted secret).

```csharp
_ = new Aws.SecretsManager.SecretVersion(
    "telehealth-db-secret-version",
    new Aws.SecretsManager.SecretVersionArgs
    {
        SecretId = dbSecret.Id,
        SecretString = cfg.DbPassword,
    }
);
```
- `SecretVersion` = **Puts the actual password inside the envelope.** The password comes from Pulumi config (which you typed in securely). AWS encrypts it with KMS.

### Enhanced Monitoring Role — The Security Guard's Badge

```csharp
var rdsMonitoringRole = new Aws.Iam.Role(...)
{
    AssumeRolePolicy = @"{ ... ""Principal"": { ""Service"": ""monitoring.rds.amazonaws.com"" } ... }"
}
```
- `Iam.Role` = An **identity badge** in AWS. This badge says: "Only the RDS monitoring service can wear me."
- The JSON is an IAM **trust policy** — who is allowed to use this role.

```csharp
_ = new Aws.Iam.RolePolicyAttachment(...)
{
    PolicyArn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
```
- **Attaches** a pre-built AWS permission set to the badge. This gives the monitoring service permission to publish metrics.

### The RDS PostgreSQL Instance — The Vault Itself

```csharp
var database = new Aws.Rds.Instance(
    "telehealth-db",
    new Aws.Rds.InstanceArgs
    {
        Engine = "postgres",
        EngineVersion = "18.3",
        InstanceClass = cfg.DbInstanceClass,  // e.g., db.t3.micro
        AllocatedStorage = 20,
        DbName = cfg.DbName,
        Username = cfg.DbUsername,
        Password = cfg.DbPassword,
        VpcSecurityGroupIds = { net.DbSecurityGroup.Id },
        DbSubnetGroupName = net.DbSubnetGroup.Name,
```
- `Engine = "postgres"` = The type of database.
- `EngineVersion = "18.3"` = PostgreSQL version.
- `VpcSecurityGroupIds` = Attach the firewall from `Networking.cs` (only EB can talk to it).
- `DbSubnetGroupName` = Spread across the data center streets from `Networking.cs`.

```csharp
        PubliclyAccessible = false,
        StorageEncrypted = true,
```
- `PubliclyAccessible = false` = **No internet access.** This is the most important security line.
- `StorageEncrypted = true` = Encrypt the hard drive the database sits on. AWS does this for free.

```csharp
        BackupRetentionPeriod = 7,
        BackupWindow = "03:00-04:00",
        MaintenanceWindow = "sun:04:30-sun:05:30",
```
- `BackupRetentionPeriod = 7` = Keep 7 days of automated backups.
- `BackupWindow = "03:00-04:00"` = 3 AM to 4 AM UTC (low traffic time).
- `MaintenanceWindow` = AWS can patch the database engine Sunday early morning.

```csharp
        MonitoringInterval = 60,
        MonitoringRoleArn = rdsMonitoringRole.Arn,
        PerformanceInsightsEnabled = true,
        EnabledCloudwatchLogsExports = { "postgresql", "upgrade" },
```
- `MonitoringInterval = 60` = Collect detailed metrics every 60 seconds.
- `PerformanceInsightsEnabled = true` = A premium AWS feature that shows which SQL queries are slow.
- `EnabledCloudwatchLogsExports` = Send PostgreSQL's own logs to CloudWatch for central viewing.

```csharp
    },
    new CustomResourceOptions { Protect = true }
);
```
- `Protect = true` = **AWS will refuse to delete this database** even if you run `pulumi destroy`. This prevents accidental deletion of patient data.

---

## 6. 📊 `Observability.cs` — The Security Cameras and Alarm System

**Real-world analogy:** You install security cameras (logs), motion detectors (metric alarms), and GPS trackers (X-Ray tracing) so you know what's happening in your building.

### CloudWatch Log Group — The Security Camera Footage Room

```csharp
var apiLogGroup = new Aws.CloudWatch.LogGroup(
    "telehealth-api-logs",
    new Aws.CloudWatch.LogGroupArgs
    {
        Name = $"/telehealth/{cfg.StackName}/api",
        RetentionInDays = 30,
```
- `LogGroup` = A **folder** in AWS CloudWatch where logs are stored.
- `RetentionInDays = 30` = Delete logs older than 30 days to save money.

### Metric Alarms — The Motion Detectors

```csharp
_ = new Aws.CloudWatch.MetricAlarm(
    "rds-high-cpu",
    new Aws.CloudWatch.MetricAlarmArgs
    {
        ComparisonOperator = "GreaterThanThreshold",
        EvaluationPeriods = 2,
        MetricName = "CPUUtilization",
        Namespace = "AWS/RDS",
        Period = 300,
        Statistic = "Average",
        Threshold = 80,
        AlarmActions = { msg.OpsAlertsTopic.Arn },
        OkActions = { msg.OpsAlertsTopic.Arn },
```
- `MetricAlarm` = Watches a number and screams if it crosses a line.
- `MetricName = "CPUUtilization"` = Watch the database CPU percentage.
- `EvaluationPeriods = 2` + `Period = 300` = Check every 5 minutes; trigger alarm if it's bad for **2 checks in a row** (10 minutes total). This prevents false alarms from brief spikes.
- `Threshold = 80` = Scream if CPU is over 80%.
- `AlarmActions` = **What to do when the alarm triggers?** Send a message to the `ops-alerts` SNS topic. This could email the on-call engineer.
- `OkActions` = **What to do when it recovers?** Also send a message ("All clear!").

```csharp
_ = new Aws.CloudWatch.MetricAlarm(
    "rds-low-storage",
    new Aws.CloudWatch.MetricAlarmArgs
    {
        MetricName = "FreeStorageSpace",
        Threshold = 2_147_483_648, // 2 GiB in bytes
```
- Watches disk space. `2_147_483_648` bytes = exactly 2 GB. When free space drops below 2 GB, scream.

### X-Ray Tracing — The GPS Tracker

```csharp
_ = new Aws.Xray.SamplingRule(...)
{
    FixedRate = 0.10, // Sample 10% of remaining requests
    UrlPath = "/api/*",
}
```
- `Xray.SamplingRule` = "Record detailed traces for some requests."
- `FixedRate = 0.10` = Only trace 10% of requests to save money. You don't need to trace every single HTTP ping.
- `UrlPath = "/api/*"` = Only trace API calls, not static files.

```csharp
var xrayGroup = new Aws.Xray.Group(...)
{
    GroupName = $"telehealth-api-{cfg.StackName}",
    FilterExpression = "service(\"telehealth-api\")",
```
- `Xray.Group` = A **folder** in the X-Ray console that only shows traces for this specific application.

---

## 7. 🖥️ `Compute.cs` — The Server Farm

**Real-world analogy:** This file builds the garage (ECR) where you store your delivery trucks (Docker images), creates the driver's license (IAM role), and sets up the trucking depot (Elastic Beanstalk) where the trucks operate.

### ECR Repository — The Garage

```csharp
var ecrRepo = new Aws.Ecr.Repository(
    "telehealth-api-repo",
    new Aws.Ecr.RepositoryArgs
    {
        Name = $"telehealth-api-{cfg.StackName}",
        ImageTagMutability = "MUTABLE",
        ImageScanningConfiguration = new Aws.Ecr.Inputs.RepositoryImageScanningConfigurationArgs
        {
            ScanOnPush = true,
        },
```
- `Ecr.Repository` = A **Docker image registry**. When GitHub Actions builds your backend Docker image, it pushes it here.
- `ImageTagMutability = "MUTABLE"` = Allow overwriting the `latest` tag.
- `ScanOnPush = true` = AWS automatically scans every uploaded image for known security vulnerabilities.

```csharp
_ = new Aws.Ecr.LifecyclePolicy(...)
{
    Policy = @"{
        ""rules"": [
            { ""description"": ""Remove untagged images after 1 day"" ... },
            { ""description"": ""Keep last 10 tagged images"" ... }
        ]
    }"
}
```
- **Garbage collection rules.** AWS automatically deletes old Docker images so you don't pay for storage of ancient builds.
- Rule 1: Delete unnamed images after 1 day.
- Rule 2: Keep only the 10 most recent named images.

### IAM Role for Elastic Beanstalk — The Driver's License

```csharp
var ebRole = new Aws.Iam.Role(
    "eb-ec2-role",
    new Aws.Iam.RoleArgs
    {
        AssumeRolePolicy = @"{
            ""Statement"": [{
                ""Principal"": { ""Service"": ""ec2.amazonaws.com"" },
                ""Effect"": ""Allow""
            }]
        }",
```
- `Iam.Role` = A **permission badge** that your server wears.
- `Principal = "ec2.amazonaws.com"` = Only EC2 (Elastic Compute Cloud) servers can wear this badge. When EB launches your server, the server assumes this role.

#### Managed Policies — Broad Permissions

```csharp
foreach (var (suffix, policyArn) in new[]
{
    ("eb-web-tier", "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"),
    ("eb-ecr-readonly", "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"),
    ("eb-xray", "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"),
    ("eb-ssm", "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"),
})
{
    _ = new Aws.Iam.RolePolicyAttachment(...);
}
```
- `foreach` = Loop through this list and do the same thing for each item.
- These are **AWS-managed policies** — pre-written permission sets:
  - `AWSElasticBeanstalkWebTier` = Basic EB operations.
  - `AmazonEC2ContainerRegistryReadOnly` = Allow pulling Docker images from ECR.
  - `AWSXRayDaemonWriteAccess` = Send tracing data to X-Ray.
  - `AmazonSSMManagedInstanceCore` = Allow AWS Systems Manager to remotely manage the server.

#### Scoped Inline Policies — Narrow Permissions

The rest of the IAM section creates **custom, narrow policies** that only allow access to specific resources created in this stack:

| Policy | What It Allows | Scope |
|--------|---------------|-------|
| SQS | Send/receive/delete messages | Only the processing queue |
| SNS | Publish to topics | Only the medical alerts topic + MassTransit management |
| CloudWatch Logs | Write logs | Only the API log group |
| S3 | Read/write files | Only the lab reports bucket |
| Secrets Manager | Read secret | Only the DB password secret |
| SES | Send emails | Any recipient (for appointment reminders) |

```csharp
Policy = msg.ProcessingQueue.Arn.Apply(queueArn =>
    $@"{{ ... ""Resource"": ""{queueArn}"" ... }}")
```
- `.Apply()` = A Pulumi trick. `queueArn` isn't known until AWS creates the queue. This says: "Once you know the ARN, insert it into this JSON policy string."

### Instance Profile — Attaching the Badge to the Server

```csharp
var instanceProfile = new Aws.Iam.InstanceProfile(
    "eb-instance-profile",
    new Aws.Iam.InstanceProfileArgs { Role = ebRole.Name }
);
```
- An **instance profile** is the physical holder that attaches the IAM role to an EC2 server. EB uses this to give your server its permissions.

### Elastic Beanstalk Application — The Trucking Company

```csharp
var ebApp = new Aws.ElasticBeanstalk.Application(
    "telehealth-api",
    new Aws.ElasticBeanstalk.ApplicationArgs { Tags = cfg.Tags }
);
```
- `ElasticBeanstalk.Application` = The **company name**. It's a container that holds multiple versions of your app.

### Elastic Beanstalk Environment — The Depot

```csharp
var ebEnv = new Aws.ElasticBeanstalk.Environment(
    "telehealth-env",
    new Aws.ElasticBeanstalk.EnvironmentArgs
    {
        Application = ebApp.Name,
        SolutionStackName = "64bit Amazon Linux 2023 v4.12.1 running Docker",
```
- `Environment` = The **actual running server**.
- `SolutionStackName` = The operating system image. This one means: "Use Amazon Linux 2023, and run Docker containers."

#### The Settings Array

Inside `Settings = new[] { ... }`, there are dozens of configuration knobs:

**Instance & Networking:**
```csharp
EbSetting("aws:autoscaling:launchconfiguration", "IamInstanceProfile", instanceProfile.Name),
EbSetting("aws:autoscaling:launchconfiguration", "InstanceType", "t3.micro"),
EbSetting("aws:autoscaling:launchconfiguration", "SecurityGroups", net.EbSecurityGroup.Id),
EbSetting("aws:elasticbeanstalk:environment", "EnvironmentType", "SingleInstance"),
```
- `InstanceType = "t3.micro"` = A small, cheap server (about $8/month).
- `SecurityGroups` = Attach the front gate firewall from `Networking.cs`.
- `EnvironmentType = "SingleInstance"` = One server only (no load balancer). Cheaper for dev; for production you'd use `LoadBalanced`.

**CloudWatch Logs:**
```csharp
EbSetting("aws:elasticbeanstalk:cloudwatch:logs", "StreamLogs", "true"),
EbSetting("aws:elasticbeanstalk:cloudwatch:logs", "RetentionInDays", "30"),
```
- Stream container logs directly to CloudWatch automatically.

**X-Ray:**
```csharp
EbSetting("aws:elasticbeanstalk:xray", "XRayEnabled", "true"),
```

**Application Environment Variables:**
These are injected into the running container and read by the .NET app:

```csharp
EbEnvVar("ASPNETCORE_ENVIRONMENT", "Production"),
EbEnvVar("ASPNETCORE_HTTP_PORTS", "8080"),
EbEnvVar("Cors__AllowedOrigins", storage.FrontendBucket.WebsiteEndpoint.Apply(ep => $"http://{ep},...")),
```
- `Cors__AllowedOrigins` = The `__` syntax is how .NET reads nested config. This tells the API: "Only accept web requests from these origins." The frontend bucket URL is inserted dynamically.

```csharp
EbEnvVar("ConnectionStrings__Database",
    Output.Tuple(db.Instance.Address, cfg.DbPassword)
        .Apply(t => $"Host={t.Item1};Port=5432;Database={cfg.DbName};...")),
```
- `Output.Tuple(...)` = Combine two not-yet-known values. Once both the DB address and password are ready, build the connection string.

**VPC Placement:**
```csharp
EbSetting("aws:ec2:vpc", "VPCId", net.VpcId),
EbSetting("aws:ec2:vpc", "Subnets", net.SubnetIds.Apply(ids => string.Join(",", ids))),
```
- Place the server inside the VPC and across multiple subnets for availability.

---

## 8. ⚡ `Serverless.cs` — The Robot Workers

**Real-world analogy:** Lambda functions are like **robot workers** that only wake up when a specific event happens. They don't sit around costing money 24/7 — you only pay for the milliseconds they run.

### PDF Processor Lambda — The Document Scanner

```csharp
var lambdaRole = new Aws.Iam.Role(
    "lambda-pdf-processor-role",
    new Aws.Iam.RoleArgs
    {
        AssumeRolePolicy = @"{
            ""Principal"": { ""Service"": ""lambda.amazonaws.com"" },
            ...
        }",
```
- This role says: "Only Lambda functions can use this badge."

```csharp
_ = new Aws.Iam.RolePolicyAttachment("lambda-basic-execution", ...);
_ = new Aws.Iam.RolePolicyAttachment("lambda-sqs-execution", ...);
```
- `AWSLambdaBasicExecutionRole` = Write logs to CloudWatch.
- `AWSLambdaSQSQueueExecutionRole` = Read messages from SQS queues.

```csharp
var pdfProcessorLambda = new Aws.Lambda.Function(
    "lab-pdf-processor",
    new Aws.Lambda.FunctionArgs
    {
        Name = $"telehealth-lab-pdf-processor-{cfg.StackName}",
        Role = lambdaRole.Arn,
        Runtime = "dotnet10",
        Handler = "LabPdfProcessor-dev-ProcessPdfDocument::...::FunctionHandler",
        MemorySize = 256,
        Timeout = 30,
        Code = new FileArchive("./dummy-lambda"),
```
- `Runtime = "dotnet10"` = AWS runs this using .NET 10.
- `Handler` = The exact C# class and method to call when triggered.
- `MemorySize = 256` = Allocate 256 MB of RAM. More memory = faster CPU (AWS scales CPU with memory).
- `Timeout = 30` = If it runs longer than 30 seconds, kill it.
- `Code = new FileArchive("./dummy-lambda")` = A placeholder ZIP. **GitHub Actions overwrites this later.**

```csharp
    new CustomResourceOptions { IgnoreChanges = { "sourceCodeHash" } }
```
- **Critical line.** Tells Pulumi: "Don't touch the code after initial creation." If Pulumi updated the code, it would revert the real deployment back to the dummy placeholder.

```csharp
_ = new Aws.Lambda.EventSourceMapping(
    "sqs-to-lambda-mapping",
    new Aws.Lambda.EventSourceMappingArgs
    {
        EventSourceArn = msg.ProcessingQueue.Arn,
        FunctionName = pdfProcessorLambda.Arn,
        BatchSize = 10,
        FunctionResponseTypes = { "ReportBatchItemFailures" },
```
- `EventSourceMapping` = "When messages arrive in this SQS queue, wake up the Lambda."
- `BatchSize = 10` = Grab up to 10 messages at once for efficiency.
- `ReportBatchItemFailures` = If 1 out of 10 messages fails, only retry that one. Don't punish the other 9.

### Appointment Reminder Lambda — The Receptionist

```csharp
var reminderLambda = new Aws.Lambda.Function(
    "appointment-reminder",
    new Aws.Lambda.FunctionArgs
    {
        MemorySize = 256,
        Timeout = 60,
        Code = new FileArchive("./dummy-lambda"),
```
- `Timeout = 60` = Email sending might take longer than PDF processing.

```csharp
_ = new Aws.Lambda.Permission(
    "reminder-sns-invoke",
    new Aws.Lambda.PermissionArgs
    {
        Principal = "sns.amazonaws.com",
        SourceArn = msg.AppointmentBookedTopic.Arn,
    }
);
```
- **Lambda permissions are "deny by default."** Even though the SNS topic tries to trigger it, AWS blocks it. This line explicitly allows the SNS service to wake up this Lambda.

```csharp
_ = new Aws.Sns.TopicSubscription(
    "reminder-sns-sub",
    new Aws.Sns.TopicSubscriptionArgs
    {
        Topic = msg.AppointmentBookedTopic.Arn,
        Protocol = "lambda",
        Endpoint = reminderLambda.Arn,
    }
);
```
- **Subscribes** the Lambda to the SNS topic. Now, whenever an appointment is booked, SNS broadcasts to this Lambda.

### Appointment Notifications Lambda — Same Pattern

The third Lambda handles **cancelled** and **rescheduled** appointments. It uses the same pattern:
1. Create a role with SES email permissions.
2. Create the Lambda with dummy code.
3. Add Lambda permissions for both SNS topics.
4. Subscribe the Lambda to both topics.

---

## 🗺️ How All Files Connect

```
Config.cs (Settings Notebook)
    │
    ▼
Networking.cs (Fence & Gates) ───────┐
    │                                  │
    ▼                                  ▼
Storage.cs (Filing Cabinets)      Database.cs (Vault)
    │                                  │
    ▼                                  ▼
Messaging.cs (Post Office) ◄─── Uses firewall & subnets
    │                                  │
    ▼                                  ▼
Observability.cs (Cameras) ◄─── Uses DB & messaging topics
    │                                  │
    ▼                                  ▼
Compute.cs (Server Farm) ◄───── Uses ALL of the above
    │ (ECR, EB, IAM)                 │
    └──────────────────────────────────┘
                │
                ▼
Serverless.cs (Robot Workers) ◄─ Uses messaging & storage
```

Each file returns a `Result` object that acts like a **shipping label**. `Program.cs` passes these labels to the next files so they know which specific resources to reference.

---

## 📋 Key C# / Pulumi Syntax Recap

| Syntax | What It Means |
|--------|-------------|
| `new Thing("name", new ThingArgs { ... })` | Create an AWS resource named `"name"` with these settings. |
| `Output<T>` / `Input<T>` | A value not known until AWS creates the resource. Pulumi handles the waiting automatically. |
| `.Apply(x => ...)` | "Once `x` is known, do this with it." |
| `Output.Tuple(a, b).Apply(t => ...)` | "Once BOTH `a` and `b` are known, use them together." |
| `_ = new Thing(...)` | "Create this, but I don't need to store a reference." |
| `required` | C# feature: you MUST set this property when creating the object. |
| `init;` | You can only set this during object creation, never after. |
| `??` | "If the left side is null/empty, use the right side instead." |
| `$"text {variable}"` | String interpolation — insert variable values into text. |
| `@"{ ""json"": ""here"" }"` | Verbatim string with literal quotes inside. |
| `CustomResourceOptions { Protect = true }` | AWS will refuse to delete this resource. |
| `CustomResourceOptions { IgnoreChanges = { "field" } }` | Pulumi won't overwrite this field on subsequent updates. |

---

