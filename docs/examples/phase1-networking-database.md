# Phase 1: Foundation - Networking & Database

**Phase Goal:** Establish networking and database layer with security best practices.

**Components:**

- VPC with public/private subnets (2 AZs)
- Internet Gateway + NAT Gateway
- RDS PostgreSQL (db.t4g.micro, Single-AZ, encrypted)
- Security groups with least privilege rules
- Default resource tagging strategy

**Prerequisites:**

- Pulumi CLI installed
- AWS credentials configured
- Pulumi Cloud backend initialized

---

## Architecture Overview

```bash
┌─────────────────────────────────────────────────────────────┐
│                    VPC: telehealth-dev-vpc                  │
│  CIDR: 10.0.0.0/16                                         │
│                                                             │
│  ┌─────────────────┐        ┌─────────────────┐          │
│  │   Public Subnet │        │   Public Subnet │          │
│  │ 10.0.1.0/24     │        │ 10.0.2.0/24     │          │
│  │  (AZ: us-east-1a)│        │  (AZ: us-east-1b)│          │
│  │                 │        │                 │          │
│  │  NAT Gateway    │        │  NAT Gateway    │          │
│  │  (us-east-1a)   │        │  (us-east-1b)   │          │
│  └────────┬────────┘        └────────┬────────┘          │
│           │                          │                   │
│  ┌────────▼────────┐        ┌────────▼────────┐          │
│  │  Private Subnet │        │  Private Subnet │          │
│  │ 10.0.3.0/24     │        │ 10.0.4.0/24     │          │
│  │  (AZ: us-east-1a)│        │  (AZ: us-east-1b)│          │
│  │                 │        │                 │          │
│  │  RDS PostgreSQL │        │  (Standby -     │          │
│  │  (Single-AZ)    │        │   Single-AZ)    │          │
│  └─────────────────┘        └─────────────────┘          │
│                                                             │
│  Internet Gateway                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Pulumi Code

### 1. Default Tags Component

Create `infra/Components/Tags.cs`:

```csharp
using System.Collections.Generic;
using Pulumi;

namespace TeleHealth.Infra.Components
{
    public static class ResourceTags
    {
        public static Dictionary<string, string> GetDefaultTags()
        {
            return new Dictionary<string, string>
            {
                ["Project"] = "TeleHealth",
                ["Environment"] = Deployment.Instance.StackName,
                ["ManagedBy"] = "pulumi",
                ["Owner"] = "university-assignment",
                ["CostCenter"] = "education"
            };
        }

        public static string ResourceName(string service, string resourceType)
        {
            return $"telehealth-{Deployment.Instance.StackName}-{service}-{resourceType}";
        }
    }
}
```

---

### 2. Networking Component

Create `infra/Components/Networking.cs`:

```csharp
using System.Collections.Generic;
using System.Linq;
using Pulumi;
using Pulumi.Aws.Ec2;
using Pulumi.Aws.Ec2.Inputs;
using TeleHealth.Infra.Components;

namespace TeleHealth.Infra.Components
{
    public class Networking : ComponentResource
    {
        public Vpc Vpc { get; }
        public Subnet[] PublicSubnets { get; }
        public Subnet[] PrivateSubnets { get; }
        public InternetGateway InternetGateway { get; }
        public NatGateway[] NatGateways { get; }
        public SecurityGroup DatabaseSecurityGroup { get; }

        public Networking(string name, NetworkingArgs args, ComponentResourceOptions? options = null)
            : base("telehealth:infra:Networking", name, options)
        {
            var defaultTags = ResourceTags.GetDefaultTags();
            var resourceName = ResourceTags.ResourceName;

            // VPC
            Vpc = new Vpc(resourceName("vpc", "main"), new VpcArgs
            {
                CidrBlock = "10.0.0.0/16",
                EnableDnsHostnames = true,
                EnableDnsSupport = true,
                Tags = defaultTags.Merge(new Dictionary<string, string>
                {
                    ["Name"] = resourceName("vpc", "main")
                })
            }, new CustomResourceOptions { Parent = this });

            // Internet Gateway
            InternetGateway = new InternetGateway(resourceName("igw", "main"), new InternetGatewayArgs
            {
                VpcId = Vpc.Id,
                Tags = defaultTags.Merge(new Dictionary<string, string>
                {
                    ["Name"] = resourceName("igw", "main")
                })
            }, new CustomResourceOptions { Parent = this });

            // Public Subnets (2 AZs)
            var azs = new[] { "us-east-1a", "us-east-1b" };
            PublicSubnets = new Subnet[2];
            
            for (int i = 0; i < 2; i++)
            {
                PublicSubnets[i] = new Subnet(resourceName("subnet", $"public-{i + 1}"), new SubnetArgs
                {
                    VpcId = Vpc.Id,
                    CidrBlock = $"10.0.{i + 1}.0/24",
                    AvailabilityZone = azs[i],
                    MapPublicIpOnLaunch = true,
                    Tags = defaultTags.Merge(new Dictionary<string, string>
                    {
                        ["Name"] = resourceName("subnet", $"public-{i + 1}"),
                        ["Type"] = "public"
                    })
                }, new CustomResourceOptions { Parent = this });
            }

            // Private Subnets (2 AZs)
            PrivateSubnets = new Subnet[2];
            for (int i = 0; i < 2; i++)
            {
                PrivateSubnets[i] = new Subnet(resourceName("subnet", $"private-{i + 1}"), new SubnetArgs
                {
                    VpcId = Vpc.Id,
                    CidrBlock = $"10.0.{i + 3}.0/24",
                    AvailabilityZone = azs[i],
                    MapPublicIpOnLaunch = false,
                    Tags = defaultTags.Merge(new Dictionary<string, string>
                    {
                        ["Name"] = resourceName("subnet", $"private-{i + 1}"),
                        ["Type"] = "private"
                    })
                }, new CustomResourceOptions { Parent = this });
            }

            // Elastic IPs for NAT Gateways
            var eips = new ElasticIp[2];
            for (int i = 0; i < 2; i++)
            {
                eips[i] = new ElasticIp(resourceName("eip", $"nat-{i + 1}"), new ElasticIpArgs
                {
                    Domain = "vpc",
                    Tags = defaultTags.Merge(new Dictionary<string, string>
                    {
                        ["Name"] = resourceName("eip", $"nat-{i + 1}")
                    })
                }, new CustomResourceOptions { Parent = this });
            }

            // NAT Gateways (one per public subnet)
            NatGateways = new NatGateway[2];
            for (int i = 0; i < 2; i++)
            {
                NatGateways[i] = new NatGateway(resourceName("nat", $"gateway-{i + 1}"), new NatGatewayArgs
                {
                    SubnetId = PublicSubnets[i].Id,
                    AllocationId = eips[i].Id,
                    Tags = defaultTags.Merge(new Dictionary<string, string>
                    {
                        ["Name"] = resourceName("nat", $"gateway-{i + 1}")
                    })
                }, new CustomResourceOptions { Parent = this });
            }

            // Public Route Table
            var publicRt = new RouteTable(resourceName("rt", "public"), new RouteTableArgs
            {
                VpcId = Vpc.Id,
                Routes = new[]
                {
                    new RouteTableRouteArgs
                    {
                        CidrBlock = "0.0.0.0/0",
                        GatewayId = InternetGateway.Id
                    }
                },
                Tags = defaultTags.Merge(new Dictionary<string, string>
                {
                    ["Name"] = resourceName("rt", "public")
                })
            }, new CustomResourceOptions { Parent = this });

            // Associate public subnets with public route table
            for (int i = 0; i < 2; i++)
            {
                _ = new RouteTableAssociation(resourceName("rta", $"public-{i + 1}"), new RouteTableAssociationArgs
                {
                    SubnetId = PublicSubnets[i].Id,
                    RouteTableId = publicRt.Id
                }, new CustomResourceOptions { Parent = this });
            }

            // Private Route Tables (one per private subnet for NAT)
            for (int i = 0; i < 2; i++)
            {
                var privateRt = new RouteTable(resourceName("rt", $"private-{i + 1}"), new RouteTableArgs
                {
                    VpcId = Vpc.Id,
                    Routes = new[]
                    {
                        new RouteTableRouteArgs
                        {
                            CidrBlock = "0.0.0.0/0",
                            NatGatewayId = NatGateways[i].Id
                        }
                    },
                    Tags = defaultTags.Merge(new Dictionary<string, string>
                    {
                        ["Name"] = resourceName("rt", $"private-{i + 1}")
                    })
                }, new CustomResourceOptions { Parent = this });

                _ = new RouteTableAssociation(resourceName("rta", $"private-{i + 1}"), new RouteTableAssociationArgs
                {
                    SubnetId = PrivateSubnets[i].Id,
                    RouteTableId = privateRt.Id
                }, new CustomResourceOptions { Parent = this });
            }

            // Database Security Group
            DatabaseSecurityGroup = new SecurityGroup(resourceName("sg", "database"), new SecurityGroupArgs
            {
                VpcId = Vpc.Id,
                Description = "Security group for RDS PostgreSQL database",
                Ingress = new[]
                {
                    new SecurityGroupIngressArgs
                    {
                        Protocol = "tcp",
                        FromPort = 5432,
                        ToPort = 5432,
                        CidrBlocks = new[] { "10.0.0.0/16" }, // Allow from within VPC only
                        Description = "Allow PostgreSQL from within VPC"
                    }
                },
                Egress = new[]
                {
                    new SecurityGroupEgressArgs
                    {
                        Protocol = "-1",
                        FromPort = 0,
                        ToPort = 0,
                        CidrBlocks = new[] { "0.0.0.0/0" },
                        Description = "Allow all outbound traffic"
                    }
                },
                Tags = defaultTags.Merge(new Dictionary<string, string>
                {
                    ["Name"] = resourceName("sg", "database")
                })
            }, new CustomResourceOptions { Parent = this });

            // Register outputs
            RegisterOutputs(new Dictionary<string, object?>
            {
                ["VpcId"] = Vpc.Id,
                ["PublicSubnetIds"] = PublicSubnets.Select(s => s.Id),
                ["PrivateSubnetIds"] = PrivateSubnets.Select(s => s.Id),
                ["DatabaseSecurityGroupId"] = DatabaseSecurityGroup.Id
            });
        }
    }

    public class NetworkingArgs : ResourceArgs
    {
        // Add any custom arguments here if needed
    }
}
```

---

### 3. Database Component

Create `infra/Components/Database.cs`:

```csharp
using System.Collections.Generic;
using Pulumi;
using Pulumi.Aws.Rds;
using Pulumi.Aws.Rds.Inputs;
using Pulumi.Aws.Ec2;
using Pulumi.Aws.Kms;
using Pulumi.Random;
using TeleHealth.Infra.Components;

namespace TeleHealth.Infra.Components
{
    public class Database : ComponentResource
    {
        public Instance RdsInstance { get; }
        public Output<string> Endpoint { get; }
        public Output<string> Password { get; }

        public Database(string name, DatabaseArgs args, ComponentResourceOptions? options = null)
            : base("telehealth:infra:Database", name, options)
        {
            var defaultTags = ResourceTags.GetDefaultTags();
            var resourceName = ResourceTags.ResourceName;

            // Generate random password for RDS
            var dbPassword = new RandomPassword(resourceName("password", "rds"), new RandomPasswordArgs
            {
                Length = 16,
                Special = true,
                OverrideSpecial = "!#$%&*()-_=+[]{}<>:?",
            }, new CustomResourceOptions { Parent = this });

            Password = dbPassword.Result;

            // KMS Key for RDS encryption
            var kmsKey = new Key(resourceName("kms", "rds"), new KeyArgs
            {
                Description = "KMS key for RDS PostgreSQL encryption",
                DeletionWindowInDays = 7,
                EnableKeyRotation = true,
                Tags = defaultTags.Merge(new Dictionary<string, string>
                {
                    ["Name"] = resourceName("kms", "rds")
                })
            }, new CustomResourceOptions { Parent = this });

            // DB Subnet Group (uses private subnets)
            var subnetGroup = new SubnetGroup(resourceName("subnetgroup", "rds"), new SubnetGroupArgs
            {
                SubnetIds = args.PrivateSubnetIds,
                Tags = defaultTags.Merge(new Dictionary<string, string>
                {
                    ["Name"] = resourceName("subnetgroup", "rds")
                })
            }, new CustomResourceOptions { Parent = this });

            // RDS Parameter Group (for PostgreSQL tuning)
            var paramGroup = new ParameterGroup(resourceName("pg", "rds"), new ParameterGroupArgs
            {
                Family = "postgres16",
                Description = "Custom parameter group for TeleHealth database",
                Parameters = new[]
                {
                    new ParameterGroupParameterArgs
                    {
                        Name = "log_min_duration_statement",
                        Value = "1000" // Log queries taking > 1 second
                    },
                    new ParameterGroupParameterArgs
                    {
                        Name = "log_connections",
                        Value = "1"
                    }
                },
                Tags = defaultTags
            }, new CustomResourceOptions { Parent = this });

            // RDS Instance
            RdsInstance = new Instance(resourceName("rds", "postgres"), new InstanceArgs
            {
                Identifier = resourceName("rds", "postgres"),
                Engine = "postgres",
                EngineVersion = "16.1",
                InstanceClass = args.InstanceClass ?? "db.t4g.micro",
                AllocatedStorage = args.AllocatedStorage ?? 20,
                StorageEncrypted = true,
                KmsKeyId = kmsKey.Arn,
                
                DbName = args.DatabaseName ?? "telehealth",
                Username = args.Username ?? "telehealth_admin",
                Password = dbPassword.Result,
                
                VpcSecurityGroupIds = new[] { args.SecurityGroupId },
                DbSubnetGroupName = subnetGroup.Name,
                ParameterGroupName = paramGroup.Name,
                
                PubliclyAccessible = false,
                MultiAz = args.EnableMultiAz ?? false,
                
                BackupRetentionPeriod = args.BackupRetentionDays ?? 7,
                BackupWindow = "03:00-04:00",
                MaintenanceWindow = "Mon:04:00-Mon:05:00",
                
                SkipFinalSnapshot = args.SkipFinalSnapshot ?? true,
                DeleteAutomatedBackups = args.DeleteAutomatedBackups ?? false,
                
                Tags = defaultTags.Merge(new Dictionary<string, string>
                {
                    ["Name"] = resourceName("rds", "postgres")
                })
            }, new CustomResourceOptions { Parent = this });

            Endpoint = RdsInstance.Endpoint;

            // Register outputs
            RegisterOutputs(new Dictionary<string, object?>
            {
                ["Endpoint"] = RdsInstance.Endpoint,
                ["Port"] = RdsInstance.Port,
                ["DatabaseName"] = RdsInstance.DbName,
                ["Username"] = RdsInstance.Username,
                ["Password"] = dbPassword.Result,
                ["KmsKeyId"] = kmsKey.Id
            });
        }
    }

    public class DatabaseArgs : ResourceArgs
    {
        public InputList<string> PrivateSubnetIds { get; set; } = new InputList<string>();
        public Input<string> SecurityGroupId { get; set; } = null!;
        public Input<string>? InstanceClass { get; set; }
        public Input<int>? AllocatedStorage { get; set; }
        public Input<string>? DatabaseName { get; set; }
        public Input<string>? Username { get; set; }
        public Input<bool>? EnableMultiAz { get; set; }
        public Input<int>? BackupRetentionDays { get; set; }
        public Input<bool>? SkipFinalSnapshot { get; set; }
        public Input<bool>? DeleteAutomatedBackups { get; set; }
    }
}
```

---

### 4. Main Program Integration

Update `infra/Program.cs`:

```csharp
using System.Collections.Generic;
using Pulumi;
using TeleHealth.Infra.Components;

return await Deployment.RunAsync(() =>
{
    var config = new Config();
    var stackName = Deployment.Instance.StackName;

    // Phase 1: Foundation - Networking and Database
    
    // 1. Create Networking
    var networking = new Networking("networking", new NetworkingArgs());
    
    // 2. Create Database
    var database = new Database("database", new DatabaseArgs
    {
        PrivateSubnetIds = networking.PrivateSubnets.Select(s => s.Id),
        SecurityGroupId = networking.DatabaseSecurityGroup.Id,
        InstanceClass = config.Get("dbInstanceClass") ?? "db.t4g.micro",
        DatabaseName = config.Get("dbName") ?? "telehealth",
        Username = config.Get("dbUsername") ?? "telehealth_admin",
        EnableMultiAz = config.GetBoolean("enableMultiAz") ?? false,
        BackupRetentionDays = config.GetInt32("backupRetentionDays") ?? 7,
        SkipFinalSnapshot = false, // Keep final snapshot for safety
        DeleteAutomatedBackups = false
    });

    // Store database password as a secret
    config.SetSecret("dbPassword", database.Password);

    // Export outputs
    return new Dictionary<string, object?>
    {
        // Networking outputs
        ["VpcId"] = networking.Vpc.Id,
        ["PublicSubnetIds"] = networking.PublicSubnets.Select(s => s.Id),
        ["PrivateSubnetIds"] = networking.PrivateSubnets.Select(s => s.Id),
        
        // Database outputs
        ["DatabaseEndpoint"] = database.Endpoint,
        ["DatabasePort"] = database.RdsInstance.Port,
        ["DatabaseName"] = database.RdsInstance.DbName,
        ["DatabaseUsername"] = database.RdsInstance.Username,
        ["DatabaseKmsKeyId"] = database.RdsInstance.KmsKeyId,
        
        // Security
        ["DatabaseSecurityGroupId"] = networking.DatabaseSecurityGroup.Id
    };
});
```

---

## Stack Configuration

Create `infra/Pulumi.dev.yaml`:

```yaml
config:
  aws:region: us-east-1
  telehealth:dbInstanceClass: db.t4g.micro
  telehealth:dbName: telehealth_dev
  telehealth:dbUsername: telehealth_admin
  telehealth:enableMultiAz: false
  telehealth:backupRetentionDays: 7
```

---

## Deployment Steps

### 1. Initialize Pulumi Project

```bash
cd infra

# Login to Pulumi Cloud (backend)
pulumi login

# Create dev stack
pulumi stack init dev

# Set configuration
pulumi config set aws:region us-east-1
pulumi config set --secret dbPassword "your-temporary-password" # Will be overwritten by RandomPassword
```

### 2. Preview Changes

```bash
pulumi preview
```

**Expected Output:**

```bash
Previewing update (dev)

     Type                                        Name                            Plan       Info
 +   pulumi:pulumi:Stack                         telehealth-dev                  create     1 message
 +   └─ telehealth:infra:Networking              networking                      create
 +   │  ├─ aws:ec2:Vpc                           telehealth-dev-vpc-main         create
 +   │  ├─ aws:ec2:InternetGateway               telehealth-dev-igw-main         create
 +   │  ├─ aws:ec2:Subnet                        telehealth-dev-subnet-public-1  create
 +   │  ├─ aws:ec2:Subnet                        telehealth-dev-subnet-public-2  create
 +   │  ├─ aws:ec2:Subnet                        telehealth-dev-subnet-private-1 create
 +   │  ├─ aws:ec2:Subnet                        telehealth-dev-subnet-private-2 create
 +   │  ├─ aws:ec2:SecurityGroup                telehealth-dev-sg-database      create
 +   │  └─ ...
 +   └─ telehealth:infra:Database                database                        create
 +      ├─ random:index:RandomPassword           telehealth-dev-password-rds     create
 +      ├─ aws:kms:Key                           telehealth-dev-kms-rds          create
 +      ├─ aws:rds:SubnetGroup                   telehealth-dev-subnetgroup-rds  create
 +      ├─ aws:rds:ParameterGroup                telehealth-dev-pg-rds           create
 +      └─ aws:rds:Instance                      telehealth-dev-rds-postgres     create

Outputs:
    DatabaseEndpoint: output<string>
    DatabasePort    : output<string>
    VpcId           : output<string>
    ...
```

### 3. Deploy Infrastructure

```bash
pulumi up --yes
```

**Duration:** ~10-15 minutes (RDS creation takes time)

---

## Validation

### 1. Check Pulumi Outputs

```bash
pulumi stack output
```

**Expected Output:**

```bash
Current stack outputs (9):
    DatabaseEndpoint      : telehealth-dev-rds-postgres.cxxxxxxxxxx.us-east-1.rds.amazonaws.com
    DatabaseKmsKeyId      : arn:aws:kms:us-east-1:123456789:key/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    DatabaseName          : telehealth_dev
    DatabasePort          : 5432
    DatabaseSecurityGroupId: sg-xxxxxxxxxxxxx
    DatabaseUsername      : telehealth_admin
    PrivateSubnetIds      : ["subnet-xxxxxxxxxxxxx", "subnet-yyyyyyyyyyyyy"]
    PublicSubnetIds       : ["subnet-zzzzzzzzzzzzz", "subnet-aaaaaaaaaaaaa"]
    VpcId                 : vpc-xxxxxxxxxxxxx
```

### 2. Local Testing with awslocal

```bash
# Install awslocal if not already installed
pip install awscli-local

# Set environment variables
export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

# Verify VPC creation
awslocal ec2 describe-vpcs --vpc-ids $(pulumi stack output VpcId)

# Verify RDS instance
awslocal rds describe-db-instances \
  --db-instance-identifier telehealth-dev-rds-postgres

# Verify encryption
awslocal rds describe-db-instances \
  --db-instance-identifier telehealth-dev-rds-postgres \
  --query 'DBInstances[0].StorageEncrypted'
# Expected: true

# Check security group rules
awslocal ec2 describe-security-groups \
  --group-ids $(pulumi stack output DatabaseSecurityGroupId) \
  --query 'SecurityGroups[0].IpPermissions'
```

### 3. Database Connectivity Test

```bash
# Get password from Pulumi (decrypted)
pulumi stack output --show-secrets

# Test connection (requires psql client)
psql \
  -h $(pulumi stack output DatabaseEndpoint) \
  -p $(pulumi stack output DatabasePort) \
  -U $(pulumi stack output DatabaseUsername) \
  -d $(pulumi stack output DatabaseName) \
  -c "SELECT version();"
```

**Note:** You may need to whitelist your IP in the database security group for local testing:

```bash
# Get your public IP
MY_IP=$(curl -s https://checkip.amazonaws.com)

# Add ingress rule (temporary for testing)
awslocal ec2 authorize-security-group-ingress \
  --group-id $(pulumi stack output DatabaseSecurityGroupId) \
  --protocol tcp \
  --port 5432 \
  --cidr "${MY_IP}/32" \
  --description "Temporary dev access"
```

### 4. Verify Encryption and Security

```bash
# Check S3 bucket encryption (if any created)
awslocal s3api get-bucket-encryption --bucket <bucket-name>

# Verify KMS key exists
awslocal kms describe-key --key-id $(pulumi stack output DatabaseKmsKeyId)

# List all resources with tags
awslocal ec2 describe-instances \
  --filters "Name=tag:Project,Values=TeleHealth" \
  --query 'Reservations[].Instances[].Tags'
```

---

## Troubleshooting

### Issue: RDS Instance Stuck in "Creating"

**Cause:** RDS takes 5-10 minutes to provision.

**Solution:** Wait longer or check status:

```bash
awslocal rds describe-db-instances \
  --db-instance-identifier telehealth-dev-rds-postgres \
  --query 'DBInstances[0].DBInstanceStatus'
```

### Issue: Security Group Blocks Connection

**Cause:** Security group only allows VPC-internal traffic.

**Solution:**

1. Connect from within VPC (EC2 instance)
2. Or temporarily add your IP (see validation section)
3. Or use AWS Systems Manager Session Manager (most secure)

### Issue: NAT Gateway Costs

**Warning:** NAT Gateways cost ~$35/month each. For dev environment:

**Option A:** Use NAT instances (cheaper, ~$5/month) - requires more management
**Option B:** Keep current setup but remember to destroy dev stack when not in use
**Option C:** Remove NAT Gateways entirely if outbound internet not needed

```bash
# Destroy dev stack when not in use (saves money)
pulumi destroy --stack dev
```

### Issue: KMS Key Deletion

**Cause:** KMS keys have a 7-30 day deletion window.

**Solution:** If you see "KMS key pending deletion" errors, either:

1. Wait for deletion period to end
2. Use a new key alias
3. Cancel deletion:

```bash
aws kms cancel-key-deletion --key-id <key-id>
```

---

## Cost Breakdown (Monthly Estimate)

| Resource | Free Tier | Our Usage | Cost |
| ---------- | ----------- | ----------- | ------ |
| VPC | Free | 1 VPC | $0.00 |
| NAT Gateway (2) | N/A | 2 x 730 hours | ~$70.00 ⚠️ |
| RDS (db.t4g.micro) | 750 hrs | 1 instance | $0.00 ✅ |
| KMS Key | N/A | 1 key + requests | ~$1.00 |
| Elastic IP (2) | 1 free | 2 addresses | ~$7.00 ⚠️ |
| Data Transfer | 100GB | < 10GB | $0.00 ✅ |

**⚠️ Cost Alert:** NAT Gateways are the biggest expense. For a university project:

- Use NAT instances instead (cheaper but more complex)
- Or accept the cost (~$80/month total for dev environment)
- Or destroy dev stack when not actively developing

**Money-Saving Alternative:**

```csharp
// Use NAT instances instead of NAT Gateways (cheaper)
// Add this to Networking.cs as an option:

// Instead of:
new NatGateway(...)

// Use NAT instances:
new Instance(resourceName("ec2", $"nat-{i + 1}"), new InstanceArgs
{
    Ami = "ami-0c55b159cbfafe1f0", // Amazon Linux 2 NAT AMI
    InstanceType = "t3.micro",
    SubnetId = PublicSubnets[i].Id,
    SourceDestCheck = false,
    Tags = defaultTags
});
```

---

## Next Steps

After Phase 1 validation:

1. ✅ Database connectivity confirmed
2. ✅ Encryption enabled and verified
3. ✅ Security groups properly configured
4. ✅ All resources tagged

**Proceed to Phase 2:** Compute Layer (Beanstalk + ALB)

See [phase2-compute.md](phase2-compute.md)

---

## Cleanup

To destroy all Phase 1 resources:

```bash
cd infra
pulumi destroy --stack dev

# Remove stack if needed
pulumi stack rm dev
```

**⚠️ Warning:** This will delete the database and all data. Ensure you have:

- Created a manual snapshot if needed:

```bash
awslocal rds create-db-snapshot \
  --db-instance-identifier telehealth-dev-rds-postgres \
  --db-snapshot-identifier telehealth-dev-backup-$(date +%Y%m%d)
```

- Exported any important data

---

**Status:** ✅ Phase 1 Complete  
**Next:** [Phase 2 - Compute Layer](phase2-compute.md)
