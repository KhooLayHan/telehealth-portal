# Task #2 — Cloud Architecture Reference

> This document goes with `task2-architecture.drawio` (the diagram file).
> Task #2 builds on top of Task #1. All concepts from Task #1 (AZs, VPC, Security Groups, Pulumi, IAM, EB deployment) still apply — this document only explains what is **new**.

---

## What Is New Compared to Task #1

Task #1 was: Users → S3 (frontend) + EB (API) → RDS (database).

Task #2 adds three layers on top of that base:

| Layer | What was added |
|---|---|
| Serverless | API Gateway + 4 Lambda functions |
| Event-driven Messaging | SNS topics, SQS queues, Dead Letter Queue, SES email delivery |
| Observability | CloudWatch, X-Ray, RDS Enhanced Monitoring |

---

## The Full Picture

```
Users (Browser)                           Admin (Dashboard)
      │                                         │
      ├── HTTP → S3 (React SPA)                 │ HTTPS
      │          HTML / JS / CSS                ▼
      │                               API Gateway (ANY /process)
      │ HTTP :80 (REST API)                     │ Invoke
      ▼                                         ▼
┌──────────────────────── AWS Cloud (us-east-1) ─────────────────────────────────────────────┐
│                                                                                             │
│  S3 React SPA   S3 EB Artifacts   S3 Lab Reports   ECR   IAM   Secrets Manager             │
│                                                                                             │
│  ┌──── Default VPC ───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                         │ │
│  │  ┌── Public Subnets ────────────────────────────────────────────────────────────────┐  │ │
│  │  │  ┌── eb-sg (port 80, 443) ──────────────────────────────────────────────────┐   │  │ │
│  │  │  │   EB (Elastic Beanstalk) — .NET 10 API                                   │   │  │ │
│  │  │  │   publishes events via MassTransit ──────────────────────────────────────┼───┼──┼─┼──→ SNS topics
│  │  │  └──────────────────────────────────────────────────────────────────────────┘   │  │ │
│  │  └──────────────────────────────────────────────────────────────────────────────────┘  │ │
│  │              │ TCP :5432                                                                │ │
│  │  ┌── DB Subnet Group (Private) ─────────────────────────────────────────────────────┐  │ │
│  │  │  ┌── db-sg (port 5432 from eb-sg only) ─────────────────────────────────────┐   │  │ │
│  │  │  │   RDS PostgreSQL 18.3                                                     │   │  │ │
│  │  │  └──────────────────────────────────────────────────────────────────────────┘   │  │ │
│  │  └──────────────────────────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                             │
│  SNS (medical-alerts-topic) ──→ SQS (report-processing-queue) ──→ Lambda (lab-pdf-processor) ──→ S3 (Lab Reports)
│                                      └──→ SQS (Dead Letter Queue)                          │
│                                                                                             │
│  SNS (appointment-booked)      ──→ Lambda (appointment-reminder)      ──→ SES ──→ Patient Email
│  SNS (appointment-cancelled)   ──→ Lambda (appointment-notifications) ──→ SES ──→ Patient Email
│  SNS (appointment-rescheduled) ──→ Lambda (appointment-notifications) ──→ SES ──→ Patient Email
│                                                                                             │
│  API Gateway ──→ Lambda (admin-analytics)                                                   │
│                                                                                             │
│  CloudWatch (logs + alarms) ←── EB, all Lambdas, RDS                                       │
│  X-Ray (traces)             ←── EB                                                          │
│  RDS Enhanced Monitoring    ←── RDS (60s interval)                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                    ▲
GitHub Actions ─────┘
cd-infra.yml + cd-frontend.yml + cd-backend.yml + cd-lambda.yml
```

---

## Every New AWS Service Added in Task #2

| Service | Settings | What it does in this project |
|---|---|---|
| API Gateway | HTTP API, ANY /process | Entry point for admin dashboard requests — routes to admin-analytics Lambda |
| Lambda — admin-analytics | .NET 10, 512 MB | Processes admin analytics requests, triggered by API Gateway |
| Lambda — lab-pdf-processor | .NET 10, 256 MB | Reads lab report PDFs from S3 and processes them, triggered by SQS |
| Lambda — appointment-reminder | .NET 10, 256 MB | Sends appointment confirmation emails via SES, triggered by SNS |
| Lambda — appointment-notifications | .NET 10, 256 MB | Sends cancellation and reschedule emails via SES, triggered by SNS |
| SNS — medical-alerts-topic | KMS encrypted | Receives LabReportCompletedEvent from EB, fans out to SQS |
| SNS — appointment-booked | Standard | Receives AppointmentBookedEvent from EB, triggers Lambda |
| SNS — appointment-cancelled | Standard | Receives AppointmentCancelledEvent from EB, triggers Lambda |
| SNS — appointment-rescheduled | Standard | Receives AppointmentRescheduledEvent from EB, triggers Lambda |
| SNS — ops-alerts-topic | Standard | Receives CloudWatch alarm notifications for RDS health issues |
| SQS — report-processing-queue | SSE encrypted, 360s visibility timeout | Buffers lab report events between SNS and Lambda |
| SQS — Dead Letter Queue | 14-day retention | Catches messages that fail processing 3 times |
| SES (Simple Email Service) | Email delivery | Sends emails to patients — reminders, cancellations, reschedules |
| CloudWatch | Log groups, metric alarms, 30-day retention | Collects logs from all services, fires alarms on RDS CPU and storage thresholds |
| X-Ray | 10% + 5 req/s reservoir sampling rule | Traces request paths through the .NET API for performance debugging |
| RDS Enhanced Monitoring | 60s interval | OS-level metrics from inside the RDS instance sent to CloudWatch |

---

## Concept 1 — Event-Driven Architecture — The Big Pattern Change

In Task #1, EB handled everything directly:

```
User request → EB → RDS → response back to user
```

EB does everything. The user waits for EB to fully finish before getting a response.

In Task #2, EB no longer does everything itself. It does its main job, announces what happened, and moves on. Other services pick up the follow-up work independently. This is called **event-driven** — things happen in reaction to events being announced.

**Example — Appointment Notification Pipeline:**

```
Task #1 style (EB does everything):
  Patient books appointment
      → EB saves to RDS
      → EB sends confirmation email (takes time)
      → only THEN responds to patient
  Patient waits. If email service is down, the whole booking fails.

Task #2 (event-driven, Appointment Notification Pipeline):
  Patient books appointment
      → EB saves to RDS                                    ← main job done
      → EB publishes "AppointmentBookedEvent" to SNS       ← just announces it
      → EB immediately responds to patient ✓               ← patient gets response now

  Meanwhile in the background:
      SNS → Lambda (appointment-reminder) → SES → email sent to patient
```

EB does not wait for the email. It announces "appointment booked" and moves on. Lambda hears the announcement and handles the email separately — the patient already got their booking confirmation by then.

**Example — Lab Report Processing Pipeline:**

```
Task #2 (event-driven, Lab Report Processing Pipeline):
  Lab report is ready
      → EB uploads PDF to S3                               ← saves the file
      → EB publishes "LabReportCompletedEvent" to SNS      ← just announces it
      → EB immediately responds ✓

  Meanwhile in the background:
      SNS → SQS → Lambda (lab-pdf-processor) → reads and processes the PDF from S3
```

Same pattern — EB does its main job, announces it, moves on. Lambda handles the heavy PDF processing separately.

**Why decouple like this?**

| Problem with doing everything in EB | How event-driven solves it |
|---|---|
| Sending an email takes time — patient waits for EB to finish before getting a response | EB announces the event and immediately responds. Lambda sends the email in the background |
| If the email service is down, the whole booking fails | EB publishes the event and finishes. If Lambda fails, the message retries — the booking still succeeded |
| Processing a PDF is slow and resource-heavy | EB offloads it to a dedicated Lambda instead of blocking the main API |

**One-line summary:** Event-driven means EB does its main job, shouts "this happened" to SNS, and moves on. The follow-up work (emails, PDF processing) happens separately in the background via the Appointment Notification Pipeline and Lab Report Processing Pipeline.

---

## Concept 2 — SNS (Simple Notification Service) — Pub/Sub Messaging

SNS is a **publish/subscribe** (pub/sub) messaging service. One publisher sends a message to a topic, and every subscriber receives it instantly.

```
Publisher (EB)
      │
      │ Publish(AppointmentBookedEvent)
      ▼
SNS Topic (appointment-booked)
      │
      ├──→ Subscriber A: Lambda (appointment-reminder)   ← receives the message
      └──→ Subscriber B: (could add more later)          ← also receives the same message
```

**In this project, SNS topics and who subscribes to them:**

| SNS Topic | Who publishes | Who subscribes |
|---|---|---|
| medical-alerts-topic | EB (LabReportCompletedEvent) | SQS (report-processing-queue) |
| appointment-booked | EB (AppointmentBookedEvent) | Lambda (appointment-reminder) |
| appointment-cancelled | EB (AppointmentCancelledEvent) | Lambda (appointment-notifications) |
| appointment-rescheduled | EB (AppointmentRescheduledEvent) | Lambda (appointment-notifications) |
| ops-alerts-topic | CloudWatch alarms | (ops team gets notified) |

**Why use SNS instead of EB calling Lambda directly?**

```
Without SNS (EB calls Lambda directly):
  EB must know every Lambda's name and ARN (Amazon Resource Name)
  If you add a new Lambda later, you have to change the EB code
  EB is tightly coupled to every downstream service

With SNS (EB publishes to a topic):
  EB only knows the topic name — it publishes and walks away
  Any number of subscribers can listen without EB knowing about them
  Adding a new subscriber later = zero changes to EB code
```

**One-line summary:** SNS is like a PA announcement — one person speaks, everyone in every room hears it simultaneously.

---

## Concept 3 — SQS (Simple Queue Service) — Why Both SNS and SQS Are Used

SQS is a **message queue** — messages sit and wait until a consumer pulls and processes them. Unlike SNS which pushes instantly, SQS holds messages until Lambda is ready.

```
SNS (instant push)           SQS (messages wait in line)
      │                              │
      ▼                              ▼
All subscribers receive        Consumer pulls when ready
it at the same time            Messages survive if consumer fails
```

**Why the lab report pipeline uses BOTH:**

```
EB → SNS (medical-alerts-topic) → SQS (report-processing-queue) → Lambda
```

The SNS-to-SQS step is called a **fan-out buffer**:

- SNS delivers instantly to SQS (the subscriber)
- SQS holds the message until Lambda is ready to process
- If Lambda is busy, messages queue up — nothing is dropped
- Lambda processes in **batches of 10** — more efficient than one at a time
- The **360-second visibility timeout** means once Lambda picks up a message, SQS hides it for 6 minutes. If Lambda doesn't finish in time, the message becomes visible again for another Lambda to retry

**Why does the appointment pipeline skip SQS?**

```
Appointment pipeline:   SNS → Lambda directly (no SQS)
Lab report pipeline:    SNS → SQS → Lambda
```

| | Appointment notifications | Lab report processing |
|---|---|---|
| Time sensitivity | Must go out immediately — patient needs confirmation now | Can be processed in the background, no rush |
| Batch processing needed? | No — one email per event | Yes — batch 10 PDFs at a time is more efficient |
| Buffer needed if Lambda busy? | No — Lambda is fast enough | Yes — PDF processing is slow and resource-heavy |

**One-line summary:** SQS is like a ticket queue at a deli — customers take a number and wait. The staff (Lambda) serves them in order at their own pace, never getting overwhelmed.

---

## Concept 4 — Dead Letter Queue (DLQ) — What Happens When Processing Fails

A Dead Letter Queue is a **safety net** for messages that cannot be processed successfully.

**Without a DLQ:**

```
SQS → Lambda picks up message → Lambda fails
    → message becomes visible again after 360s
    → Lambda picks it up again → fails again
    → repeat forever
    → broken message loops indefinitely, blocking the queue
```

**With a DLQ (maxReceiveCount = 3):**

```
SQS → Lambda picks up message → Lambda fails   (attempt 1)
    → message becomes visible again
    → Lambda picks it up → fails again          (attempt 2)
    → message becomes visible again
    → Lambda picks it up → fails again          (attempt 3)
    → maxReceiveCount reached
    → message moves to Dead Letter Queue (14-day retention)
    → developer inspects the DLQ, fixes the bug, replays the message
    → nothing permanently lost
```

**14-day retention** means the failed message sits in the DLQ for 14 days before expiring. That gives the developer time to investigate and fix the issue before the message disappears.

**One-line summary:** The DLQ stops broken messages from looping forever — after 3 failed attempts, the message is set aside for a developer to examine.

---

## Concept 5 — AWS Lambda — Functions That Run Only When Triggered

A Lambda function is a piece of code that **runs only when something triggers it** — there is no server sitting idle waiting for work. AWS spins up the function, runs it, and shuts it down.

```
No trigger → Lambda does not exist (no compute, no cost)

Trigger arrives (SQS message / SNS event / API Gateway call)
    → AWS starts the Lambda container
    → runs the function code
    → function finishes
    → AWS shuts it down
    → billing stops
```

**The four Lambda functions in this project:**

| Lambda | Trigger | What it does |
|---|---|---|
| admin-analytics | API Gateway (HTTPS request) | Processes admin analytics — triggered by the admin dashboard |
| lab-pdf-processor | SQS (report-processing-queue) | Reads lab PDFs from S3 and processes them |
| appointment-reminder | SNS (appointment-booked) | Sends appointment confirmation email via SES |
| appointment-notifications | SNS (appointment-cancelled / rescheduled) | Sends cancellation or reschedule email via SES |

**Why Lambda instead of adding these to EB?**

```
Putting everything in EB:
  EB must stay running 24/7 to handle occasional PDF processing
  One slow PDF job blocks other API requests on the same machine
  Scaling EB to handle PDF spikes = expensive

Using Lambda:
  Lambda only runs when there is a PDF to process
  Each PDF gets its own isolated function invocation — no blocking
  Lambda scales automatically — 100 PDFs arrive at once = 100 parallel invocations
  Pay only for the milliseconds the function actually runs
```

**One-line summary:** Lambda is like a contractor — you call them only when there is specific work to do. They show up, do the job, and leave. You are not paying them to sit in the office all day.

---

## Concept 6 — IAM for Lambda — Execution Role vs Instance Profile

IAM (Identity and Access Management) still applies in Task #2 — every Lambda function needs a role so it has permission to call other AWS services. The fundamentals (User, Role, Policy) are already explained in Task #1 Concept 7. What is **new and different** here is how the role attaches.

In Task #1, EB runs on EC2 — EC2 cannot accept a raw IAM Role directly. It needs an **Instance Profile** as a wrapper/middleman:

```
Task #1 — EB (EC2-based):
  IAM Role (eb-ec2-role)
      ↓ wrapped inside
  Instance Profile
      ↓ attached to
  EC2 machine (which EB runs on)
```

Lambda is not EC2 — it is its own managed compute. It accepts an IAM Role directly with no Instance Profile needed:

```
Task #2 — Lambda:
  IAM Role (Execution Role)
      ↓ attached directly to
  Lambda function
  (no Instance Profile — Lambda is not EC2)
```

You can confirm this in the AWS IAM console — the Trusted Entity column tells you who can use the role:

```
eb-ec2-role-61ea1a5             → Trusted entity: AWS Service: ec2
                                   ← EC2-based → needs Instance Profile

lambda-admin-analytics-role     → Trusted entity: AWS Service: lambda
lambda-notifications-role       → Trusted entity: AWS Service: lambda
lambda-pdf-processor-role       → Trusted entity: AWS Service: lambda
lambda-reminder-role            → Trusted entity: AWS Service: lambda
                                   ← Lambda-based → attaches directly, no Instance Profile
```

**Each Lambda has its own Execution Role with only the permissions it needs:**

| Lambda | What its Execution Role allows |
|---|---|
| lab-pdf-processor | s3:GetObject (Lab Reports bucket), sqs:ReceiveMessage + DeleteMessage (report-processing-queue) |
| appointment-reminder | ses:SendEmail |
| appointment-notifications | ses:SendEmail |
| admin-analytics | its own analytics permissions |

This is the same **least privilege** principle from Task #1 — each Lambda only gets permission for exactly what it needs. If `appointment-reminder` tried to call S3 or SQS, AWS would return AccessDenied because its role only allows `ses:SendEmail`.

**One-line summary:** Lambda uses an Execution Role that attaches directly — no Instance Profile needed because Lambda is not EC2. Same IAM concepts as Task #1, different attachment mechanism.

---

## Concept 7 — API Gateway — The Serverless Entry Point

API Gateway is a managed service that **receives HTTP requests from the internet and routes them to a Lambda function**. It is the front door for the serverless layer.

```
Without API Gateway:
  Lambda functions cannot be called directly from the internet
  They have no public URL or HTTP endpoint

With API Gateway:
  Admin Dashboard → HTTPS request to API Gateway URL
      → API Gateway receives it
      → invokes Lambda (admin-analytics)
      → Lambda returns result
      → API Gateway sends response back to admin dashboard
```

**Why not just route admin requests through EB?**

Admin analytics requests are a completely different workload from regular patient API calls. Running them through EB would mix admin and user traffic on the same machine. API Gateway gives the admin dashboard its own dedicated entry point — completely separate from EB, with its own scaling and security.

**One-line summary:** API Gateway is the door that lets the internet call a Lambda function — without it, Lambda has no public-facing URL.

---

## Concept 8 — SES (Simple Email Service) — Sending Emails

SES is AWS's email sending service. Lambda functions call SES to deliver emails to patients — AWS handles the actual SMTP (Simple Mail Transfer Protocol) delivery.

```
Lambda (appointment-reminder)
      │
      │ ses:SendEmail (To: patient@email.com, Subject: Appointment Confirmed)
      ▼
SES (Simple Email Service)
      │
      │ SMTP Delivery
      ▼
Patient Email Inbox
```

**Why SES instead of a third-party email service?**
SES is already inside AWS — Lambda can call it using the same IAM role without any external API keys or credentials. It also handles bounce handling, spam filtering compliance, and delivery tracking natively.

**One-line summary:** SES is the post office — Lambda writes the letter, hands it to SES, and SES delivers it to the right inbox.

---

## Concept 9 — MassTransit — How EB Talks to SNS

MassTransit is a .NET library inside the EB application that **abstracts publishing events to SNS**. Instead of calling the AWS SNS SDK directly, the application code publishes a typed event object and MassTransit handles routing it to the correct SNS topic.

```
Without MassTransit (calling SNS SDK directly):
  var snsClient = new AmazonSimpleNotificationServiceClient();
  await snsClient.PublishAsync(new PublishRequest {
      TopicArn = "arn:aws:sns:us-east-1:123456789:appointment-booked",
      Message = JsonSerializer.Serialize(new { appointmentId = 42, ... })
  });
  ← EB must know the exact ARN, must serialize manually, tightly coupled to SNS

With MassTransit:
  await bus.Publish(new AppointmentBookedEvent { AppointmentId = 42, ... });
  ← MassTransit maps the event type → correct SNS topic → handles serialization
  ← EB code has no SNS ARN hardcoded, no manual serialization
```

**MassTransit naming convention:** MassTransit automatically maps a class named `AppointmentBookedEvent` to an SNS topic named `appointment-booked`. The mapping is convention-based — as long as the Pulumi code creates a topic with that name, MassTransit finds it automatically.

**One-line summary:** MassTransit is the messenger — EB hands it a typed event object and MassTransit figures out which SNS topic to deliver it to.

---

## Concept 10 — CloudWatch and X-Ray — Two Different Types of Monitoring

Both CloudWatch and X-Ray are monitoring tools, but they answer different questions:

| | CloudWatch | X-Ray |
|---|---|---|
| What it collects | Logs and metrics (numbers over time) | Traces (the path of one specific request) |
| Question it answers | "How is the system behaving overall?" | "What happened to this specific request?" |
| Example | RDS CPU was 85% for the last 10 minutes | This API call took 2.3 seconds — 1.8s was spent waiting for RDS |

**CloudWatch in this project:**

```
EB → streams logs to CloudWatch (30-day retention)
All 4 Lambda functions → stream logs to CloudWatch
RDS → exports PostgreSQL and upgrade logs to CloudWatch

CloudWatch watches two metrics:
  RDS CPU > 80% for 10 minutes  → fires alarm → SNS (ops-alerts-topic) → developer notified
  RDS Free Storage < 2 GiB      → fires alarm → SNS (ops-alerts-topic) → developer notified
```

**X-Ray in this project:**

```
HTTP request arrives at EB
    → X-Ray Daemon (running inside the EB container) captures the request
    → traces every step: how long each function took, which database queries ran
    → sends trace data to X-Ray service

Sampling rule:
  Service: telehealth-api
  Path: /api/*
  Rate: 10% of requests are traced
  Reservoir: guaranteed 5 requests per second traced even at low traffic
```

The 10% sampling means X-Ray does not trace every single request — that would generate too much data and add latency. The 5 req/s reservoir guarantees traces still appear even during quiet periods.

**RDS Enhanced Monitoring** is a separate agent that runs **inside** the RDS instance and sends OS-level metrics (CPU, memory, disk I/O) to CloudWatch every 60 seconds. Standard CloudWatch RDS metrics come from outside the instance — Enhanced Monitoring comes from inside, showing finer-grained detail.

```
Standard CloudWatch RDS metrics:
  Measured from outside the instance — rough reading

RDS Enhanced Monitoring (60s interval):
  Agent running inside the RDS instance — shows OS-level CPU, memory, I/O
  Like checking blood pressure from outside vs. doing a full blood panel
```

**One-line summary:** CloudWatch watches the whole system's health over time. X-Ray follows one request step by step to find where it slowed down.

---

## Concept 11 — Native AOT — Why Lambda Compiles Differently

Normal .NET applications start with a **JIT (Just-In-Time) compiler** — when the application first runs, .NET compiles the code into machine instructions on the fly. This takes time — the first invocation of a Lambda function can take several seconds before it is ready. This is called a **cold start**.

```
Normal .NET Lambda cold start:
  Trigger arrives
      → AWS starts container
      → .NET runtime loads (slow)
      → JIT compiles the code on first run (slow)
      → function finally executes
      → total cold start: 2–5 seconds

Native AOT (Ahead-of-Time) Lambda:
  Trigger arrives
      → AWS starts container
      → binary is already compiled — runs immediately (fast)
      → total cold start: under 100ms
```

**AOT compiles the .NET code into a native binary before deployment.** The binary runs directly without any .NET runtime startup. The trade-off is the binary is larger and some .NET features that rely on runtime reflection are not available — but for Lambda functions (which are small and focused), this is not an issue.

**One-line summary:** Native AOT pre-compiles the code before deployment so Lambda starts instantly instead of spending seconds warming up on first invocation.

---

## Concept 12 — The Three Pipelines — Full Data Flow

Task #2 has three separate event-driven pipelines running in parallel. They are completely independent — a failure in one does not affect the others.

### Pipeline 1 — Admin Analytics

```
Admin Dashboard
      │ HTTPS (ANY /process)
      ▼
API Gateway
      │ Invoke
      ▼
Lambda (admin-analytics, 512 MB)
```

Admin traffic uses its own dedicated entry point — separate from EB and separate from the other pipelines.

---

### Pipeline 2 — Lab Report Processing

```
EB
  │
  ├── s3:PutObject ──────────────────────────────────────────→ S3 (Lab Reports, Private)
  │                                                                      ↑
  │ MassTransit Publish (LabReportCompletedEvent)                        │ s3:GetObject
  ▼                                                                      │
SNS (medical-alerts-topic, KMS encrypted)                                │
  │ Subscribe (SQS protocol)                                             │
  ▼                                                                      │
SQS (report-processing-queue, SSE, 360s visibility)                      │
  │                          │                                           │
  │ Event Source Mapping      │ Redrive (maxReceiveCount = 3)             │
  │ batch=10, partial fails   ▼                                          │
  │              SQS Dead Letter Queue (14-day retention)                │
  ▼                                                                      │
Lambda (lab-pdf-processor, 256 MB) ────────────────────────────────────→┘
```

EB uploads the PDF to S3 directly AND publishes an event to SNS. The event travels through SQS to Lambda, which reads the PDF back from S3 for processing.

**Implementation status:** `lab-pdf-processor` is currently **placeholder scaffolding only** — the code receives the SQS message and logs what the notification would say, but the actual PDF processing and notification sending is not yet built. The drawio shows the intended design.

---

### Pipeline 3 — Appointment Notification Pipeline

There are **3 SNS topics** but only **2 Lambda functions**, and **2 separate paths**.

---

**Path 1 — Patient books an appointment (confirmation email):**

1. Patient clicks "Book Appointment" on the frontend
2. EB receives the request → saves the appointment into RDS → main job done
3. EB shouts to SNS (appointment-booked): announces `AppointmentBookedEvent`
4. EB immediately responds to the patient — booking confirmed on screen
5. SNS passes it straight to Lambda (appointment-reminder) — no SQS buffer, goes directly
6. Lambda wakes up and processes the event — reads the `AppointmentBookedEvent` which contains:
   - PatientEmail (where to send)
   - AppointmentPublicId (appointment reference)
   - OccurredAt (when it was booked)
7. Lambda uses those details to build an email and calls SES to send it:
   ```
   Subject: Appointment Confirmed — TeleHealth Portal
   Body:    Your appointment has been confirmed.
            Appointment ID: [AppointmentPublicId]
            Booked on: [OccurredAt]
            Please arrive 10 minutes early.
   ```
8. SES delivers the email to the patient's inbox ✓

```
EB → AppointmentBookedEvent → SNS (appointment-booked)
                                    │ Subscribe (Lambda protocol)
                                    ▼
                               Lambda (appointment-reminder)   ← processes event, builds email
                                    │ ses:SendEmail
                                    ▼
                               SES → Patient Email inbox
```

---

**Path 2 — Appointment gets cancelled OR rescheduled:**

Same event-driven idea — one Lambda handles both because both result in sending an email. The Lambda checks which event it received and sends the right email.

**If cancelled:**

1. Admin/doctor cancels the appointment
2. EB saves the cancellation to RDS → shouts `AppointmentCancelledEvent` to SNS (appointment-cancelled)
3. SNS passes it to Lambda (appointment-notifications)
4. Lambda wakes up, checks: "this is a cancellation event"
5. Lambda reads the event — contains PatientEmail, AppointmentPublicId, Reason
6. Lambda builds the email and calls SES:
   ```
   Subject: Your Appointment Has Been Cancelled — TeleHealth Portal
   Body:    Your appointment has been cancelled.
            Appointment ID: [AppointmentPublicId]
            Reason: [Reason]
            Please log in to book a new appointment.
   ```
7. SES delivers to patient's inbox ✓

**If rescheduled:**

1. Admin/doctor reschedules the appointment
2. EB saves the new schedule to RDS → shouts `AppointmentRescheduledEvent` to SNS (appointment-rescheduled)
3. SNS passes it to the same Lambda (appointment-notifications)
4. Lambda wakes up, checks: "this is a reschedule event"
5. Lambda reads the event — contains PatientEmail, AppointmentPublicId, OldDate, OldTime, NewDate, NewTime
6. Lambda builds the email and calls SES:
   ```
   Subject: Your Appointment Has Been Rescheduled — TeleHealth Portal
   Body:    Your appointment has been rescheduled.
            Appointment ID: [AppointmentPublicId]
            Previous: [OldDate] at [OldTime]
            New:      [NewDate] at [NewTime]
            Please log in to view full details.
   ```
7. SES delivers to patient's inbox ✓

```
EB → AppointmentCancelledEvent   → SNS (appointment-cancelled)   ─┐
EB → AppointmentRescheduledEvent → SNS (appointment-rescheduled) ─┴→ Lambda (appointment-notifications)
                                                                        │ checks which event type
                                                                        ├── Cancelled   → builds cancellation email → SES
                                                                        └── Rescheduled → builds reschedule email  → SES
                                                                        ▼
                                                                   SES → Patient Email inbox
```

---

**The key difference between Path 1 and Path 2:**

| | Path 1 | Path 2 |
|---|---|---|
| Trigger | appointment-booked SNS | appointment-cancelled OR rescheduled SNS |
| Lambda | appointment-reminder | appointment-notifications |
| Email sent | Confirmation | Cancellation or Reschedule |
| Event types handled | 1 | 2 (Lambda checks which one) |

**Why one Lambda handles both cancelled and rescheduled?**
Both result in sending an email — the logic is similar enough to share one Lambda. It checks the event type it received and sends the right email. No need for two separate Lambdas.

**Why no SQS here (unlike the lab report pipeline)?**
Appointment emails are time-sensitive — they need to go out immediately after the event. No buffering or batching needed, so SNS invokes Lambda directly.

**Implementation status:** Both appointment Lambda functions are **fully implemented** — they actually call SES and send real emails to patients. This is different from `lab-pdf-processor` which is still placeholder scaffolding (logs the notification but does not actually send it yet).

---

## Concept 13 — The Full CI/CD Flow (Task #2)

```
Developer pushes to main branch
      ↓
cd-deploy.yml — the orchestrator
      │
      ├── cd-infra.yml  ──────────────────────────────── runs in parallel ──
      │     Runs: pulumi up
      │     Pulumi reads: infra/Program.cs → Storage.cs, Messaging.cs, Observability.cs, Serverless.cs
      │     Creates / updates:
      │       Storage.cs     → S3 buckets (React SPA, EB Artifacts, Lab Reports)
      │       Messaging.cs   → SNS topics, SQS queues, Dead Letter Queue
      │       Observability.cs → CloudWatch log groups + alarms, X-Ray group + sampling rule
      │       Serverless.cs  → Lambda function shells, IAM roles for Lambda
      │
      ├── cd-frontend.yml  ──────────────────────────── also runs in parallel ──
      │     bun run build → React compiles to HTML / JS / CSS
      │     aws s3 sync → uploads to S3 React SPA bucket
      │
      ├── cd-backend.yml  ──────────────────────────── runs AFTER cd-infra.yml ──
      │     docker build → compiles .NET 10 API into Docker image
      │     docker push → sends image to ECR
      │     eb:CreateApplicationVersion + eb:UpdateEnvironment → new version live on EB
      │     Container starts → Secrets Manager → EF Core MigrateAsync() → RDS tables applied
      │
      └── cd-lambda.yml  ──────────────────────────── runs AFTER cd-infra.yml ──
            dotnet publish (Native AOT) → zip
            aws lambda update-function-code → deploys three Lambda functions:
              - lab-pdf-processor
              - appointment-reminder
              - appointment-notifications
```

**Why cd-lambda.yml runs after cd-infra.yml and not in parallel:**
cd-lambda.yml needs the Lambda function ARNs and SQS queue URLs that Pulumi outputs after cd-infra.yml finishes. Without those outputs, cd-lambda.yml would not know where to deploy.

---

## Which Files Do What (Task #2 additions)

| File | What it does |
|---|---|
| [`infra/Program.cs`](infra/Program.cs) | Pulumi entry point — calls Storage, Messaging, Observability, Serverless |
| [`infra/Storage.cs`](infra/Storage.cs) | Creates all S3 buckets including the private Lab Reports bucket |
| [`infra/Messaging.cs`](infra/Messaging.cs) | Creates all SNS topics, SQS queues, and the Dead Letter Queue |
| [`infra/Observability.cs`](infra/Observability.cs) | Creates CloudWatch log groups, metric alarms, X-Ray group and sampling rule |
| [`infra/Serverless.cs`](infra/Serverless.cs) | Creates Lambda function shells and their IAM roles |
| [`functions/lab-pdf-processor/`](functions/lab-pdf-processor/) | Lambda source code for PDF processing |
| [`functions/appointment-reminder/`](functions/appointment-reminder/) | Lambda source code for appointment reminder emails |
| [`.github/workflows/cd-lambda.yml`](.github/workflows/cd-lambda.yml) | Builds (Native AOT) and deploys all three Lambda functions |
| [`task2-architecture.drawio`](task2-architecture.drawio) | The visual diagram this document is based on |
