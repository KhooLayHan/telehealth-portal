# Task #1 — Cloud Architecture Reference

> This document goes with `task1-architecture.drawio` (the diagram file).
> Note: EB (Elastic Beanstalk) and RDS (Relational Database Service) were torn down after submission to save AWS credits — this document describes the **original designed architecture**, not what is currently running.

---

## The Full Picture

Here is the entire system in one view, starting from the user's browser all the way down to the database:

```
Users (Browser)
      │
      ▼
  Internet
      │
      ├──────────────────────────────────────────────────────────────┐
      │  HTTP (HyperText Transfer Protocol) — loads the website      │
      ▼                                                              │
S3 (Simple Storage Service) — React SPA (Single Page Application)   │
HTML / JS / CSS served directly to the browser                       │
                                                                     │ HTTP port 80 — API requests
                                                                     ▼
┌──────────────────────── AWS (Amazon Web Services) Cloud (us-east-1) ───────────────────────┐
│                                                                                             │
│  S3 React SPA   S3 EB Artifacts   S3 Lab Reports   ECR   IAM   Secrets Manager             │
│                                                                                             │
│  ┌──────────────────── Default VPC (Virtual Private Cloud) ──────────────────────────────┐ │
│  │                                                                                        │ │
│  │  ┌────── Public Subnets (us-east-1a / 1b / 1c / 1d / 1f) ──────────────────────────┐ │ │
│  │  │  ┌── eb-sg (Security Group — TCP port 80 and 443 inbound only) ──────────────┐  │ │ │
│  │  │  │   EB (Elastic Beanstalk) — SingleInstance, Docker, t3.micro, .NET 10 API  │  │ │ │
│  │  │  └────────────────────────────────────────────────────────────────────────────┘  │ │ │
│  │  └──────────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                        │ │
│  │  ┌────── DB (Database) Subnet Group (us-east-1a / 1b / 1c / 1d / 1f) — PRIVATE ────┐ │ │
│  │  │  ┌── db-sg (Security Group — TCP port 5432 from eb-sg ONLY) ─────────────────┐  │ │ │
│  │  │  │   RDS (Relational Database Service) — PostgreSQL 18.3, db.t3.micro        │  │ │ │
│  │  │  └────────────────────────────────────────────────────────────────────────────┘  │ │ │
│  │  └──────────────────────────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                    ▲
GitHub Actions ─────┘
CI/CD (Continuous Integration / Continuous Deployment)
Automatically builds and deploys everything when you push to main
```

---

## Every AWS Service and What It Does

| Service | Settings | What it does in this project |
|---|---|---|
| EB (Elastic Beanstalk) | SingleInstance, Docker, t3.micro, .NET 10 | Runs the C# backend API. One EC2 (Elastic Compute Cloud) machine, no load balancer |
| RDS (Relational Database Service) | PostgreSQL 18.3, db.t3.micro, Encrypted | The main database — stores all users, appointments, records |
| S3 (Simple Storage Service) — React SPA | Static Website Hosting, public | Serves the built React frontend (HTML/JS/CSS) directly to browsers |
| S3 — EB Artifacts | Standard | Stores `Dockerrun.aws.json` — a file that tells EB which Docker image to run |
| S3 — Lab Reports | Private, `Protect=true` | Stores patient lab report PDFs (Portable Document Format). Cannot be deleted accidentally |
| ECR (Elastic Container Registry) | Docker image registry | Stores the built .NET Docker image. EB pulls the image from here when deploying |
| AWS Secrets Manager | Encrypted secret store | Holds the RDS database password. EB fetches it at startup — no hardcoded passwords anywhere in the code |
| IAM (Identity and Access Management) | Roles and Policies | Gives EB's EC2 machine automatic permission to call ECR, S3, and Secrets Manager |
| GitHub Actions | CI/CD automation | Automatically builds and deploys everything when you push to the main branch |

---

## Concept 1 — The Region and Availability Zones (AZ) — What is 1a, 1b, 1c, 1d, 1f?

`us-east-1` is the AWS **region** — in this case it's Northern Virginia, USA. Think of the region as a city.

Inside that city, there are 5 separate **physical data centre buildings**. Each building is called an **AZ (Availability Zone)**:

```
us-east-1 (the city = the AWS region)
├── us-east-1a  ← physical building A
├── us-east-1b  ← physical building B
├── us-east-1c  ← physical building C
├── us-east-1d  ← physical building D
└── us-east-1f  ← physical building F   (there is no 1e — AWS permanently shut it down)
```

**Why does it span across all 5 buildings?**
If building A loses power or catches fire, buildings B, C, D, and F are still running. Your system stays online. This is called **high availability** — designing your system so one failure doesn't take everything down.

**What is a subnet and how does it relate to AZs?**
A subnet is just a block of IP (Internet Protocol) addresses that lives inside one specific AZ. Think of it as a section of rooms inside one building. In the AWS Default VPC (Virtual Private Cloud), AWS automatically creates one subnet per AZ — so 5 AZs = 5 subnets, one per building.

```
Default VPC (Virtual Private Cloud)
├── Public Subnet in us-east-1a  →  EB (Elastic Beanstalk) could run here
├── Public Subnet in us-east-1b  →  or here
├── Public Subnet in us-east-1c  →  or here
├── Public Subnet in us-east-1d  →  or here
└── Public Subnet in us-east-1f  →  or here
```

Even though subnets exist in all 5 AZs, your services only **actively run in one AZ at a time**:
- EB (Elastic Beanstalk) = SingleInstance = 1 EC2 (Elastic Compute Cloud) machine = sitting in 1 AZ
- RDS (Relational Database Service) = single instance (db.t3.micro, not Multi-AZ) = sitting in 1 AZ

So why span all 5 if you only use 1 at a time?

| Service | Reason |
|---|---|
| Public Subnets — EB (Elastic Beanstalk) | EB picks any AZ to launch in. If you scaled up later, new instances would spread across AZs automatically |
| DB (Database) Subnet Group — RDS | AWS requires a subnet group to cover at least 2 AZs before it even lets you create an RDS instance. Even if RDS only runs in 1 AZ, it needs the other options available for failover |

**One-line summary:** AZ = the physical building. Subnet = the block of IP addresses inside that building. Your Default VPC has 5 buildings so it gets 5 subnets — but your actual app only runs in 1 building at a time.

---

## Concept 2 — TCP and Ports — What Do They Mean?

**TCP (Transmission Control Protocol)** is the set of rules that two computers agree to follow when talking to each other over the internet. Think of it like agreeing to speak the same language before a conversation — both computers use TCP so they understand each other.

**Port** — imagine a building (your server) with hundreds of numbered doors. The IP (Internet Protocol) address gets you to the building. The port number tells you which door to knock on.

| Port number | What uses it |
|---|---|
| 80 | HTTP (HyperText Transfer Protocol) — normal unencrypted web traffic |
| 443 | HTTPS (HTTP Secure) — encrypted web traffic |
| 5432 | PostgreSQL — the database connection door |
| 22 | SSH (Secure Shell) — a remote terminal, lets you log in and type commands into the server |

So when you see `TCP :5432`, it means: using the TCP (Transmission Control Protocol) protocol, connecting through door number 5432 — which is the PostgreSQL database door.

---

## Concept 3 — Security Groups — The Firewalls

A Security Group is a firewall that wraps around an AWS service. It decides which connections are allowed in and which are silently dropped.

### eb-sg (Elastic Beanstalk Security Group) — the firewall around EB

Only two doors are open. Everything else is dropped before the request even reaches EB.

```
An internet user sends a request
        ↓
eb-sg (Elastic Beanstalk Security Group) FIREWALL checks:
   Port 80 (HTTP)?   → YES → ALLOW → request reaches EB
   Port 443 (HTTPS)? → YES → ALLOW → request reaches EB
   Port 5432 (database)? → NO  → BLOCK → dropped, never reaches EB
   Port 22 (SSH terminal)?   → NO  → BLOCK → dropped, never reaches EB
   Anything else?            → NO  → BLOCK → dropped
```

Nobody can open a remote terminal (SSH) into the server. Nobody can talk to the database door directly. Users can only send normal web requests — which is all they should ever need to do.

### db-sg (Database Security Group) — the firewall around RDS

RDS (Relational Database Service) only accepts connections that:
- Come in on port 5432 (PostgreSQL)
- AND come from inside eb-sg (Elastic Beanstalk Security Group) — not from anywhere else

```
A hacker on the internet tries to connect directly to RDS on port 5432:
        ↓
db-sg checks: is this connection coming from eb-sg? → NO → BLOCKED

EB (Elastic Beanstalk) connects to RDS on port 5432:
        ↓
db-sg checks: is this connection coming from eb-sg? → YES → ALLOWED
```

"Blocked" means the connection is silently dropped at the firewall. RDS never even sees the request arrive. Even if someone somehow found out the exact RDS endpoint address, they still cannot connect — the door does not open for them.

---

## Concept 4 — VPC (Virtual Private Cloud) — Your Private Network

AWS's entire network is shared by millions of different customers around the world. A **VPC (Virtual Private Cloud)** is your own isolated, private section of that shared network — like having a private floor in a shared office building. Other tenants in the building cannot walk onto your floor.

**How this project's VPC is structured:**

```
Default VPC (Virtual Private Cloud)
— AWS pre-creates one of these automatically for every AWS account in every region

│
├── Public Subnets (us-east-1a / 1b / 1c / 1d / 1f)
│       These subnets have a route to the internet (traffic can flow in and out)
│       EB (Elastic Beanstalk) lives here — it NEEDS to be reachable from the internet
│       Protected by: eb-sg (Elastic Beanstalk Security Group) — only port 80 and 443 allowed in
│
└── DB (Database) Subnet Group (us-east-1a / 1b / 1c / 1d / 1f)
        RDS (Relational Database Service) lives here
        Hidden from the internet through TWO separate layers:

        Layer 1: PubliclyAccessible = false
                 → AWS gives RDS no public IP (Internet Protocol) address at all
                 → There is literally no address for the internet to connect to

        Layer 2: db-sg (Database Security Group) only allows port 5432 from eb-sg
                 → Even if something is inside the network, only EB can talk to RDS
```

**Why is it labelled "Not Publicly Accessible" if the subnets have internet routes?**
Because of those two layers above. The Default VPC subnets technically have a route to the internet, but RDS has no public IP address AND the firewall blocks everything except EB. So it is effectively private, even though it sits in the same VPC.

**Why no ALB (Application Load Balancer)?**
SingleInstance EB mode = one EC2 (Elastic Compute Cloud) machine, one IP address. Traffic goes directly from the internet through eb-sg to that one machine. No load balancer is needed — simpler and cheaper.

---

## Concept 5 — Pulumi — Infrastructure as Code

Pulumi is the tool that creates and manages all the AWS infrastructure. Instead of clicking around in the AWS website, you write C# code describing what you want to exist, and Pulumi makes it happen.

**Where the Pulumi code lives:** the `infra/` folder.

**Entry point:** [`infra/Program.cs`](infra/Program.cs) — this is the file that runs first and calls all the others:

```
infra/Program.cs  ← Pulumi starts here
  ├── Storage.cs       → creates all S3 (Simple Storage Service) buckets
  ├── Messaging.cs     → creates SQS (Simple Queue Service) queues and SNS (Simple Notification Service) topics
  ├── Observability.cs → creates CloudWatch log groups and X-Ray tracing group
  └── Serverless.cs    → creates Lambda functions and their IAM (Identity and Access Management) roles
```

> In the original design, `Networking.cs` also existed here — it set up the VPC (Virtual Private Cloud), subnets, EB (Elastic Beanstalk), and RDS (Relational Database Service). That file was deleted when the team tore down EB and RDS to save AWS credits.

**Pulumi is declarative — it does not just "check if it exists then create":**

People often think Pulumi works like: "if there is no database, create one." That is not how it works. It is smarter than that. Pulumi keeps a **state file** (stored in Pulumi Cloud) that records exactly what exists in AWS. Every time it runs:

```
Every time pulumi up runs:

  Step 1: Pulumi reads your C# code      → this is what you WANT to exist
  Step 2: Pulumi reads its state file    → this is what CURRENTLY EXISTS in AWS
  Step 3: Pulumi compares the two and acts:

    Resource exists, nothing changed?           → do nothing, leave it alone
    Resource exists but config was changed?     → update it in place
    Resource does not exist yet?                → create it
    Resource was in the state but deleted in AWS? → recreate it
```

This is called **declarative provisioning** — you declare the end state you want, and Pulumi figures out what actions to take to get there.

**`Protect = true` on RDS (Relational Database Service):**
Even if someone runs `pulumi destroy` (which deletes everything), Pulumi will refuse to delete the database. You have to manually remove the protect flag first. This prevents accidentally wiping real patient data.

---

## Concept 6 — Elastic Beanstalk — How It Gets Created and Updated

### The first time ever (creating the infrastructure from scratch)

```
Push to main branch
  → cd-infra.yml workflow triggers
  → runs pulumi up
  → Pulumi creates:
      - EB (Elastic Beanstalk) application and environment (empty shell, no app code yet)
      - RDS (Relational Database Service) database
      - S3 (Simple Storage Service) buckets
      - ECR (Elastic Container Registry)
      - IAM (Identity and Access Management) roles
      - Security Groups (eb-sg and db-sg)
```

At this point the infrastructure exists in AWS, but no application code is running yet.

### Every push after that (deploying new code)

```
Push to main branch
  → cd-backend.yml workflow triggers:

    Step 1: dotnet build  → compile the .NET 10 C# API code
    Step 2: docker build  → package that compiled code into a Docker image
    Step 3: docker push   → send the Docker image to ECR (Elastic Container Registry)
    Step 4: Upload Dockerrun.aws.json to S3 (Simple Storage Service) Artifacts bucket
            This file just says: "go pull image X from ECR and run it"
    Step 5: eb:CreateApplicationVersion → register this as a new version inside EB
    Step 6: eb:UpdateEnvironment → tell EB to switch to this new version

    EB (Elastic Beanstalk) then:
    → pulls the new Docker image from ECR (Elastic Container Registry)
    → starts the new container
    → health checks pass (AWS pings the app to confirm it is responding)
    → old container is stopped
    → new code is now live
```

**Important:** EB is NOT destroyed and recreated each time. The EC2 (Elastic Compute Cloud) machine stays running the whole time. Only the Docker container on it gets swapped out for a new one. The RDS (Relational Database Service) database is completely untouched — only the application layer changes.

**What happens every time the container starts:**
- Fetches the database password from Secrets Manager
- Runs EF Core (Entity Framework Core) `MigrateAsync()` — this automatically applies any new database migration files (there are 28 of them) to the RDS database

---

## Concept 7 — IAM (Identity and Access Management) — How Permissions Work

IAM (Identity and Access Management) controls which AWS services are allowed to call which other AWS services. This has nothing to do with your application logic — who is a doctor, who is a patient, who can book an appointment. That is all handled inside your .NET code using JWT (JSON Web Token) tokens and the database. IAM is purely the layer that governs one AWS service talking to another.

### Part 1 — The Three Things in IAM

There are three things you need to understand:

```
IAM User   = a real human person — a teammate with their own AWS login
IAM Role   = a machine identity — given to AWS services (like EB or Lambda), not to humans
IAM Policy = the actual list of rules (what actions are allowed or denied)
```

A **Policy** is literally just a text document with rules. For example:

```json
{
  "Effect": "Allow",
  "Action": "secretsmanager:GetSecretValue",
  "Resource": "arn:aws:secretsmanager:us-east-1:123:secret:telehealth/prod/db-password"
}
```

This says: allow the action of reading a secret, but only this specific secret — nothing else.

**How they link together:**

```
Policy (the rules — what is allowed or denied)
    ↓ attached to
Role (the identity — given to the machine)
    ↓ attached to
AWS Service (EB's EC2 machine, or a Lambda function, or RDS monitoring)

When that AWS service tries to do something:
  AWS checks → does this role's policy allow this action?
  YES → proceed
  NO  → AccessDenied error, blocked
```

**The three roles in this project:**

| Role | Attached to | What the policy allows |
|---|---|---|
| eb-ec2-role | EB's EC2 (Elastic Compute Cloud) machine | Pull Docker images from ECR, read/write S3 lab reports bucket, read from Secrets Manager |
| rds-monitoring-role | RDS (Relational Database Service) Enhanced Monitoring agent | Send metrics to CloudWatch every 60 seconds |
| GitHub Actions OIDC role | The GitHub Actions runner machine | Push Docker images to ECR, deploy to EB, sync files to S3 |

**IAM is only for AWS-to-AWS permissions.** It has zero connection to what your application does inside itself — which users can see which data, who is a doctor vs a patient. That is all your .NET code + JWT (JSON Web Token) tokens + database rows.

### Part 2 — How Do Users Actually Connect to EB? Is It Secure?

**How users reach EB (Elastic Beanstalk):**

```
Browser sends an HTTP (HyperText Transfer Protocol) request to EB's public IP (Internet Protocol) address
    ↓
eb-sg (Elastic Beanstalk Security Group) firewall checks: is this port 80 or 443?
    YES → request reaches the .NET Docker container running inside EB
    NO  → silently dropped
```

The user is talking to your .NET API. They are NOT touching the EC2 (Elastic Compute Cloud) machine's operating system. They cannot see the filesystem. They cannot run commands. They can only send HTTP (HyperText Transfer Protocol) requests to your API endpoints — exactly like using any website.

**Why a hacker cannot "get into" the server:**

```
eb-sg (Elastic Beanstalk Security Group) ONLY opens:
  Port 80  (HTTP — HyperText Transfer Protocol)
  Port 443 (HTTPS — HTTP Secure)

Port 22  (SSH — Secure Shell, the remote terminal) → BLOCKED
Port 3389 (RDP — Remote Desktop Protocol, Windows remote access) → BLOCKED
Everything else → BLOCKED
```

A hacker can send HTTP (HyperText Transfer Protocol) requests just like any normal user. But they cannot open a terminal into the machine. The only thing they can attack is your .NET API endpoints — not the operating system, not the filesystem, not the database directly.

### Part 3 — If a Hacker Breaks Into the API Code, Can They Get the Database?

This is the right question to ask. Here is how the layers actually work:

**Layer 1 — No hardcoded password anywhere in the code**

The database password is not in your code files. It is not in a `.env` file sitting on the server. It lives only in AWS Secrets Manager, encrypted. EB (Elastic Beanstalk) fetches it at startup using `GetSecretValue`. If someone reads all your source code, they find nothing useful.

**Layer 2 — No AWS credential keys stored on the machine either**

How does EB call Secrets Manager without a password for Secrets Manager? This is where IAM (Identity and Access Management) Instance Profiles come in:

```
EB's EC2 (Elastic Compute Cloud) machine has a Role attached to it (eb-ec2-role)

When the .NET code calls the AWS SDK (Software Development Kit):
  "please get me this secret from Secrets Manager"

AWS SDK automatically asks the EC2 metadata service:
  "what role am I running as? what temporary credentials do I currently have?"

EC2 metadata service returns a temporary token (expires in about 1 hour, auto-rotates)

SDK uses that temporary token to call Secrets Manager

No AWS access key or secret key is ever written to disk anywhere.
The credentials are temporary and invisible to anyone running inside the container.
```

**Layer 3 — Running inside a Docker container**

Your .NET API runs inside a Docker container, not directly on the EC2 (Elastic Compute Cloud) machine. Even if someone exploits a bug in your API and manages to run arbitrary commands (the worst-case scenario), they are trapped inside the container — not on the host machine. Escaping a Docker container onto the host OS (Operating System) is a separate and much harder attack.

**The full picture of what a hacker would need to do to reach the database:**

```
To read data from RDS (Relational Database Service), a hacker needs ALL of these steps:

Step 1: Exploit a code vulnerability in your .NET API           (hard)
Step 2: Escape the Docker container onto the host OS            (very hard)
Step 3: Call the EC2 metadata service to get the IAM temp token (hard, needs network access)
Step 4: Use that token to call Secrets Manager and get the DB password (needs to know the secret name)
Step 5: Connect to RDS on port 5432                             (they are inside eb-sg at this point — so allowed)

Breaking just Step 1 alone is not enough. They need ALL 5.
```

This is called **defence in depth** — multiple completely independent layers of protection. Breaking one layer does not give you the next.

**What Secrets Manager actually does (and what it does NOT do):**

Secrets Manager is not a firewall. It does not block network traffic. Its job is:
- Store the database password encrypted at rest
- Only let services with the right IAM (Identity and Access Management) role read it
- Optionally rotate the password automatically on a schedule

The security group db-sg blocks the network. Secrets Manager protects the credential. IAM controls who can fetch the credential. These are three completely separate and independent layers.

**The full attack diagram:**

```
Hacker sends HTTP request
  → eb-sg allows port 80 → hits the .NET API
  → hacker can only interact with your API like any normal user

.NET API talks to RDS (Relational Database Service) via:
  → fetches password from Secrets Manager
      (only works because eb-ec2-role IAM policy allows it)
      (no hardcoded key stored anywhere)
  → db-sg checks: is this connection coming from eb-sg? YES → RDS connection opens

Hacker tries to SSH (Secure Shell) into EB → eb-sg blocks port 22 → dead end
Hacker tries to reach RDS directly → db-sg blocks it (not coming from eb-sg) → dead end
Hacker reads the source code → no password found anywhere → dead end
```

---

## Concept 8 — What Happens When a User Uses the App

### Loading the app for the first time

```
User opens their browser
  → Request goes out to the Internet
  → Hits S3 (Simple Storage Service) — React SPA (Single Page Application)
  → Browser downloads the HTML / JS / CSS files
  → React app renders in the browser
  (The server is not involved in this step at all — it is just static files from S3)
```

### Making an API call (logging in, booking an appointment, etc.)

```
React app sends an HTTP (HyperText Transfer Protocol) request
  → Goes out to the Internet
  → eb-sg checks: port 80? YES → allowed through
  → Reaches EB (Elastic Beanstalk) — the .NET 10 API
       │
       ├── TCP (Transmission Control Protocol) port 5432
       │   → db-sg checks: is this from eb-sg? YES → ALLOWED
       │   → RDS (Relational Database Service) PostgreSQL — reads or writes the data
       │
       ├── GetSecretValue
       │   → Secrets Manager — fetches the DB password (only happens once at startup)
       │
       └── PutObject / GetObject
           → S3 (Simple Storage Service) Lab Reports bucket — uploads or downloads PDF files
```

### What happens when EB starts up (every new deployment)

```
EB (Elastic Beanstalk) machine starts
  → Pulls the .NET Docker image from ECR (Elastic Container Registry)
  → Container starts running
  → .NET app fetches the database password from Secrets Manager
  → EF Core (Entity Framework Core) runs MigrateAsync()
      → applies all 28 database migration files to RDS
  → API is ready and starts accepting requests
```

---

## Concept 9 — Security in Layers (Defence in Depth)

There are 5 completely independent layers a hacker would need to break through, one by one:

| Layer | What it protects |
|---|---|
| 1. eb-sg blocks port 22 (SSH) | Nobody can open a remote terminal into the server. They can only send HTTP requests like any normal user |
| 2. Docker container isolation | Even if the API code is exploited and arbitrary commands are run, the attacker is trapped inside the container — not on the host machine |
| 3. No hardcoded database password | The password lives only in Secrets Manager. Reading the source code gives an attacker nothing |
| 4. IAM Instance Profile — no credential keys on disk | AWS SDK gets temporary tokens automatically (they expire every ~1 hour and auto-rotate). No access key or secret key is ever stored anywhere |
| 5. db-sg blocks direct internet → RDS access + no public IP | Even knowing the RDS endpoint address is useless. The connection is dropped at the firewall and RDS has no public IP to connect to anyway |

---

## Concept 10 — The Full CI/CD (Continuous Integration / Continuous Deployment) Flow

Every push to the `main` branch is fully automatic. Zero manual steps — except database seeding.

```
Developer pushes code to the main branch
      ↓
cd-deploy.yml  — this is the orchestrator (the conductor)
It triggers all the other workflow files
      │
      ├── cd-infra.yml  ──────────────────────────────────── runs in parallel ─────────
      │     Runs: pulumi up
      │     Pulumi reads: infra/Program.cs → Storage.cs, Messaging.cs, Observability.cs, Serverless.cs
      │     Compares what the C# code says should exist vs what actually exists in AWS
      │     Creates, updates, or leaves unchanged as needed
      │
      ├── cd-frontend.yml  ──────────────────────────────── also runs in parallel ─────
      │     bun install → bun run build → React compiles to HTML / JS / CSS
      │     aws s3 sync → uploads the built files to the S3 (Simple Storage Service) React SPA bucket
      │
      ├── cd-backend.yml  ──────────────────────────────── runs AFTER cd-infra.yml ────
      │     docker build → compiles .NET 10 API into a Docker image
      │     docker push  → sends the image to ECR (Elastic Container Registry)
      │     uploads Dockerrun.aws.json to S3 (Simple Storage Service) Artifacts bucket
      │     eb:CreateApplicationVersion → registers a new version in EB
      │     eb:UpdateEnvironment → tells EB to deploy that new version
      │     EB pulls new image → new container starts → old container stops → new code is live
      │     Container starts → EF Core (Entity Framework Core) MigrateAsync() → 28 DB migrations applied automatically
      │
      └── cd-lambda.yml  ───────────────────────────────── runs AFTER cd-infra.yml ────
            dotnet publish (Native AOT — Ahead-of-Time compilation) → zip
            aws lambda update-function-code
            Deploys three Lambda functions:
              - lab-pdf-processor
              - appointment-reminder
              - appointment-notifications
```

**The one manual step — `cd-seed.yml` (Database Seeding):**

This workflow must be called manually (it cannot trigger itself). When it runs, it:
1. Takes a snapshot of RDS (Relational Database Service) — a safety backup before touching any data
2. Injects `Seed__EnableOnStartup=true` as an environment variable into EB
3. EB (Elastic Beanstalk) restarts → the seeder runs on startup → fills the database with test data
4. Removes the `Seed__EnableOnStartup` flag so future restarts do NOT re-seed
5. The seeder is idempotent — if users already exist in the database, it skips entirely (safe to accidentally run twice)

---

## Which Files Do What

| File | What it does |
|---|---|
| [`infra/Program.cs`](infra/Program.cs) | Pulumi entry point — starts here and calls all the other infra files |
| [`infra/Storage.cs`](infra/Storage.cs) | Creates all S3 (Simple Storage Service) buckets |
| [`infra/Messaging.cs`](infra/Messaging.cs) | Creates SQS (Simple Queue Service) queues and SNS (Simple Notification Service) topics |
| [`infra/Observability.cs`](infra/Observability.cs) | Creates CloudWatch log groups and X-Ray tracing group |
| [`infra/Serverless.cs`](infra/Serverless.cs) | Creates Lambda functions and their IAM (Identity and Access Management) roles |
| [`.github/workflows/cd-deploy.yml`](.github/workflows/cd-deploy.yml) | The orchestrator — triggers all other CD workflows when you push to main |
| [`.github/workflows/cd-infra.yml`](.github/workflows/cd-infra.yml) | Runs `pulumi up` — provisions the AWS infrastructure |
| [`.github/workflows/cd-frontend.yml`](.github/workflows/cd-frontend.yml) | Builds the React frontend and syncs it to S3 |
| [`.github/workflows/cd-lambda.yml`](.github/workflows/cd-lambda.yml) | Builds and deploys the three Lambda functions |
| [`.github/workflows/cd-seed.yml`](.github/workflows/cd-seed.yml) | Seeds the database with test data (called manually, not automatic) |
| [`.github/workflows/ci-backend.yml`](.github/workflows/ci-backend.yml) | Runs on Pull Requests — build check and format check only, no deployment |
| [`.github/workflows/ci-frontend.yml`](.github/workflows/ci-frontend.yml) | Runs on Pull Requests — build check and lint check only, no deployment |
| `task1-architecture.drawio` | The visual diagram that this document is based on |
