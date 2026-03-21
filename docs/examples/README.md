# Infrastructure Code Examples

This directory contains code examples and patterns referenced by the [Pulumi Infrastructure Deployment Strategy ADR](../decisions/0001-pulumi-infrastructure-deployment-strategy.md).

**Note:** These examples illustrate key concepts and patterns. For production code, see `/infra/Components/`.

## Organization

Each phase has its own example file showing:
- Key Pulumi patterns (tagging, encryption, security)
- AWS CLI validation commands
- Common pitfalls and solutions

## Quick Reference

| Phase | File | Key Concepts |
|-------|------|--------------|
| Phase 1 | [phase1-networking-database.md](phase1-networking-database.md) | VPC, RDS, Security Groups, Tags |
| Phase 2 | [phase2-compute.md](phase2-compute.md) | Beanstalk, IAM, ALB |
| Phase 3 | [phase3-storage-messaging.md](phase3-storage-messaging.md) | S3, SNS, SQS, Dead Letter Queues |
| Phase 4 | [phase4-serverless.md](phase4-serverless.md) | Lambda, API Gateway, EventBridge |
| Phase 5 | [phase5-observability.md](phase5-observability.md) | CloudWatch, X-Ray, Dashboards |
| Phase 6 | [phase6-cicd.md](phase6-cicd.md) | GitHub Actions, Pulumi Automation |

## Testing Commands

All examples include [awslocal](https://github.com/localstack/awscli-local) commands for local testing with LocalStack:

```bash
# Install awslocal
pip install awscli-local

# Start LocalStack
docker run -d -p 4566:4566 localstack/localstack

# Configure awslocal
export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

# Run example commands
awslocal s3 ls
awslocal rds describe-db-instances
```

## Common Patterns

### Pattern: Default Tags

Apply consistent tags to all resources:

```csharp
var defaultTags = new Dictionary<string, string>
{
    ["Project"] = "TeleHealth",
    ["Environment"] = pulumi.Deployment.Instance.StackName,
    ["ManagedBy"] = "pulumi",
    ["Owner"] = "university-assignment"
};
```

### Pattern: Resource Naming

Use consistent naming convention:

```csharp
string ResourceName(string service, string resourceType) => 
    $"telehealth-{pulumi.Deployment.Instance.StackName}-{service}-{resourceType}";

// Usage
var bucket = new Bucket(ResourceName("s3", "medical-reports"));
```

### Pattern: Encryption by Default

Always enable encryption:

```csharp
var bucket = new Bucket("my-bucket", new BucketArgs
{
    ServerSideEncryptionConfiguration = new BucketServerSideEncryptionConfigurationArgs
    {
        Rule = new BucketServerSideEncryptionConfigurationRuleArgs
        {
            ApplyServerSideEncryptionByDefault = new BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs
            {
                SseAlgorithm = "AES256" // or "aws:kms" for KMS
            }
        }
    }
});
```

### Pattern: Secrets Handling

Use Pulumi config for secrets:

```bash
# Set secret
pulumi config set --secret dbPassword 'your-password'

# Use in code
var config = new Config();
var dbPassword = config.RequireSecret("dbPassword");
```

## Getting Help

- [Pulumi AWS Provider Docs](https://www.pulumi.com/registry/packages/aws/)
- [AWS Free Tier Calculator](https://calculator.aws/)
- [LocalStack Documentation](https://docs.localstack.cloud/)
