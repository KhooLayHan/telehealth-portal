---
parent: Decisions
nav_order: 1
title: Pulumi Infrastructure Deployment Strategy
status: proposed
date: 2026-03-20
decision-makers: TeleHealth Portal Team
consulted: N/A
informed: N/A
---

# Pulumi Infrastructure Deployment Strategy

## Context and Problem Statement

We need to deploy the TeleHealth Portal application to AWS using Infrastructure-as-Code (IaC) for a university assignment. The project requires three key tasks: server/DB deployment (Task 1), serverless/microservices (Task 2), and monitoring (Task 3). We need a clear deployment strategy that follows real-world best practices while remaining cost-effective for an MVP.

Key constraints:
- Must use Pulumi with C#/.NET 10 (team preference)
- Must support dev and prod environments
- Must stay within AWS Free Tier or use $100 credits efficiently
- Must enable incremental development and testing
- Must integrate with GitHub Actions for CI/CD
- Must follow cloud-native best practices (encryption, least privilege, tagging)

## Decision Drivers

* **Learning & Debugging**: The team needs to understand each AWS service individually to debug effectively
* **Risk Management**: Complex infrastructure failures are harder to troubleshoot than isolated component failures
* **Cost Efficiency**: AWS Free Tier limits must be respected to avoid unexpected charges
* **Team Collaboration**: Four team members need to work on different components in parallel
* **Assignment Requirements**: Must fulfill Task 1 (Server/DB), Task 2 (Serverless), Task 3 (Monitoring)
* **Best Practices Demonstration**: Must showcase production-quality patterns (encryption, security, observability)

## Considered Options

### Option 1: Monolithic Single-Phase Deployment
Deploy all infrastructure (VPC, RDS, Beanstalk, S3, Lambda, API Gateway, CloudWatch, X-Ray) in a single `pulumi up` execution.

### Option 2: Incremental Multi-Phase Deployment
Deploy infrastructure in 6 distinct phases, with validation at each step before proceeding to the next.

### Option 3: Terraform Instead of Pulumi
Use HashiCorp Terraform with HCL instead of Pulumi with C#.

### Option 4: Serverless-First Architecture
Replace Elastic Beanstalk with API Gateway + Lambda for the entire backend, eliminating EC2 instances.

## Decision Outcome

**Chosen option:** "Option 2 - Incremental Multi-Phase Deployment with Pulumi", because it provides the best balance of learning, debugging, risk management, and aligns with university assignment constraints while still using the team's preferred technology stack (C#/.NET).

### Consequences

#### Positive

* Team learns step-by-step and can debug incrementally
* Reduces risk of complex cascading failures
* Allows parallel work (different team members own different phases)
* Demonstrates understanding of cloud architecture layers
* Easier to rollback specific components without affecting entire infrastructure
* Validates each service integration before adding complexity

#### Negative

* Takes slightly more calendar time than monolithic approach
* Requires more coordination between phases
* May lead to temporary "orphan" resources during transitions
* Team must understand inter-phase dependencies

## Phased Implementation Plan

### Phase 1: Foundation (Week 1)
**Goal:** Establish networking and database layer

**Components:**
- VPC with public/private subnets (2 AZs)
- Internet Gateway + NAT Gateway
- RDS PostgreSQL (db.t4g.micro, Single-AZ, encrypted)
- Security groups with least privilege rules
- Default resource tagging strategy

**Validation:**
- Database connectivity test from local machine via bastion/security group
- `pulumi stack output` shows RDS endpoint

**Cost Impact:** ~$13/month (Free Tier covers first year)

**Code Reference:** See [examples/phase1-networking-database](../examples/phase1-networking-database.md)

---

### Phase 2: Compute Layer (Week 2)
**Goal:** Deploy application hosting

**Components:**
- Elastic Beanstalk environment (Docker platform)
- Application Load Balancer (ALB)
- IAM instance profile with minimal permissions
- ECR repository for Docker images
- Security group rules (ALB → Beanstalk → RDS)

**Validation:**
- API health check endpoint returns 200
- Application can connect to RDS and perform CRUD operations
- Logs visible in CloudWatch

**Cost Impact:** ~$25/month (t3.micro EC2 instances)

**Code Reference:** See [examples/phase2-compute](../examples/phase2-compute.md)

---

### Phase 3: Storage & Messaging (Week 3)
**Goal:** Enable asynchronous processing

**Components:**
- S3 bucket for medical PDFs (encrypted, blocked public access)
- SNS topics (appointment-reminders, lab-reports-processed)
- SQS queues (pdf-processing, email-notifications)
- Dead-letter queues (DLQ) for failed messages
- S3 event notifications → SQS

**Validation:**
- Upload PDF to S3 triggers SQS message
- SNS publish delivers to all subscribers
- DLQ receives messages after max retries

**Cost Impact:** ~$2/month (Free Tier covers most usage)

**Code Reference:** See [examples/phase3-storage-messaging](../examples/phase3-storage-messaging.md)

---

### Phase 4: Serverless (Week 3)
**Goal:** Extract PDF processing to microservice

**Components:**
- Lambda function (.NET AOT compiled ZIP deployment)
- API Gateway (REST API) as Lambda trigger
- EventBridge rule (scheduled appointment reminders)
- IAM roles (Lambda execution, S3 read, SQS send)
- Lambda environment variables (no secrets in code)

**Validation:**
- POST to API Gateway triggers Lambda
- Lambda processes PDF and stores results
- EventBridge schedule invokes Lambda on schedule

**Cost Impact:** ~$5/month (Free Tier: 1M requests/mo, 400k GB-seconds)

**Code Reference:** See [examples/phase4-serverless](../examples/phase4-serverless.md)

---

### Phase 5: Observability (Week 4)
**Goal:** Enable monitoring and debugging

**Components:**
- CloudWatch log groups (structured JSON from Serilog)
- CloudWatch dashboards (Lambda metrics, RDS connections)
- X-Ray tracing (Lambda, API Gateway, .NET OpenTelemetry)
- CloudWatch alarms (Lambda errors, RDS CPU)

**Validation:**
- Application logs appear in CloudWatch with correlation IDs
- X-Ray service map shows request flow
- Alarms trigger on error threshold

**Cost Impact:** ~$3/month (Free Tier: 10 metrics, 10 alarms, 5GB logs)

**Code Reference:** See [examples/phase5-observability](../examples/phase5-observability.md)

---

### Phase 6: CI/CD Pipeline (Week 4)
**Goal:** Automate deployments

**Components:**
- GitHub Actions workflow (pulumi preview on PR)
- GitHub Actions workflow (pulumi up on merge to main)
- Manual approval gate for prod deployments
- Stack-specific configurations (dev vs prod)

**Validation:**
- PR triggers preview showing infrastructure changes
- Merge to main deploys to dev automatically
- Manual approval required for prod

**Cost Impact:** Free (GitHub Actions minutes within Free Tier)

**Code Reference:** See [examples/phase6-cicd](../examples/phase6-cicd.md)

---

## Resource Naming Convention

All resources follow the pattern:

```
telehealth-{environment}-{service}-{resource-type}
```

**Examples:**
- `telehealth-dev-vpc`
- `telehealth-dev-rds-postgres`
- `telehealth-dev-s3-medical-reports`
- `telehealth-dev-lambda-pdf-processor`
- `telehealth-dev-sqs-pdf-processing`

**Environment Values:** `dev`, `prod`

## Configuration Management

### Secrets Handling

**Phase 1-2:** Use `pulumi config set --secret <key>`
```bash
pulumi config set --secret dbPassword <password>
pulumi config set --secret jwtSecret <secret>
```

**Phase 3+:** Consider migration to AWS Secrets Manager + Pulumi ESC for production

### Stack-Specific Configuration

Each environment has its own `Pulumi.{stack}.yaml`:

```yaml
# Pulumi.dev.yaml
config:
  aws:region: us-east-1
  telehealth:environment: dev
  telehealth:dbInstanceClass: db.t4g.micro
  telehealth:enableMultiAz: false
  telehealth:backupRetentionDays: 7
```

```yaml
# Pulumi.prod.yaml
config:
  aws:region: us-east-1
  telehealth:environment: prod
  telehealth:dbInstanceClass: db.t4g.micro
  telehealth:enableMultiAz: false  # Can upgrade later
  telehealth:backupRetentionDays: 30
```

## Cost Management Strategy

### Free Tier Limits (First 12 Months)

| Service | Free Tier Limit | Our Usage | Status |
|---------|----------------|-----------|--------|
| EC2 (t3/t4g.micro) | 750 hours/month | ~720 hours | ✅ Safe |
| RDS (db.t4g.micro) | 750 hours/month | ~720 hours | ✅ Safe |
| S3 | 5GB storage | < 1GB | ✅ Safe |
| Lambda | 1M requests/month | < 10K | ✅ Safe |
| CloudWatch | 10 metrics, 5GB logs | Within limits | ✅ Safe |
| API Gateway | 1M REST API calls | < 100K | ✅ Safe |
| SNS | 1M publishes | < 10K | ✅ Safe |
| SQS | 1M requests | < 100K | ✅ Safe |

### Cost Optimization Tactics

1. **Single-AZ RDS** in dev/prod initially (upgrade to Multi-AZ later if needed)
2. **t4g.micro** instances (cheaper than t3.micro, better performance)
3. **Scheduled stops** for dev environment (if allowed by assignment)
4. **S3 lifecycle** policies to move old PDFs to Glacier (optional)
5. **Monitor costs** weekly via AWS Billing Dashboard

## Security & Best Practices Checklist

### Every Phase Must Include:

- [ ] **Encryption at rest** (KMS or SSE-S3 for S3, RDS encryption)
- [ ] **Encryption in transit** (TLS 1.2+, security group rules)
- [ ] **Least privilege IAM** (no `*:*` permissions)
- [ ] **Resource tagging** (Environment, Project, ManagedBy)
- [ ] **Security groups** (default deny, explicit allow rules)
- [ ] **No hardcoded secrets** (use Pulumi config or Secrets Manager)
- [ ] **Block public access** (S3 buckets unless explicitly required)

### Validation Commands

```bash
# Check S3 bucket public access
awslocal s3api get-public-access-block --bucket telehealth-dev-s3-medical-reports

# Verify RDS encryption
awslocal rds describe-db-instances --db-instance-identifier telehealth-dev-rds-postgres | grep StorageEncrypted

# List IAM role policies
awslocal iam list-role-policies --role-name telehealth-dev-lambda-role
```

## Rollback Procedures

### Phase Rollback

```bash
# Destroy specific phase resources (if isolated)
pulumi destroy --target 'urn:pulumi:dev::telehealth::aws:rds/instance:Instance::telehealth-dev-rds'

# Rollback entire stack (nuclear option)
pulumi destroy

# Restore previous state (if available)
pulumi stack export > backup.json
# ... make changes ...
pulumi stack import --file backup.json
```

### Database Recovery

```bash
# Create manual snapshot before major changes
awslocal rds create-db-snapshot \
  --db-instance-identifier telehealth-dev-rds-postgres \
  --db-snapshot-identifier telehealth-dev-pre-phase2

# Restore from snapshot if needed
awslocal rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier telehealth-dev-rds-restored \
  --db-snapshot-identifier telehealth-dev-pre-phase2
```

## Timeline & Milestones

| Week | Phase | Deliverable | Validation Criteria |
|------|-------|-------------|---------------------|
| 1 | Foundation | VPC + RDS | Database connection successful |
| 2 | Compute | Beanstalk + ALB | API health check passes |
| 3 | Storage & Messaging | S3 + SNS + SQS | PDF upload triggers queue |
| 3 | Serverless | Lambda + API Gateway | End-to-end PDF processing works |
| 4 | Observability | CloudWatch + X-Ray | Service map generated |
| 4 | CI/CD | GitHub Actions | Automated preview and deploy |

## Confirmation

Implementation will be confirmed by:

1. **Phase Validation Checklist**: Each phase includes specific validation commands
2. **Integration Tests**: End-to-end tests verify service interactions
3. **Code Review**: Infrastructure code reviewed by team members before deployment
4. **Cost Monitoring**: Weekly review of AWS Billing Dashboard to stay within budget
5. **Security Scan**: Manual review using AWS CLI commands to verify encryption and access controls

## More Information

### References

- [Pulumi AWS Provider Documentation](https://www.pulumi.com/registry/packages/aws/)
- [AWS Free Tier Details](https://aws.amazon.com/free/)
- [Elastic Beanstalk Best Practices](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/best-practices.html)
- [AWS Lambda .NET AOT](https://docs.aws.amazon.com/lambda/latest/dg/csharp-package-aot.html)

### Related Decisions

- None yet (this is the first ADR)

### Code Examples

Concrete implementation examples for each phase are maintained in:

- `/docs/examples/` - Snippets and patterns
- `/infra/` - Actual production code

See individual phase sections above for specific example references.

---

**Decision Status:** Proposed  
**Last Updated:** 2026-03-20  
**Team:** TeleHealth Portal (4 members)
