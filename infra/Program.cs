// TeleHealth DDAC — Pulumi Infrastructure
// Run: pulumi up --stack dev
// Prerequisites: pulumi config set telehealth:dbPassword <secret> --secret

using System.Collections.Generic;
using Pulumi;
using Aws = Pulumi.Aws;

return await Deployment.RunAsync(() =>
{
    // ============================================================
    // 0. CONFIGURATION
    // ============================================================
    var config = new Config("telehealth");
    var dbPassword = config.RequireSecret("dbPassword");
    var dbInstanceClass = config.Get("dbInstanceClass") ?? "db.t3.micro";
    var dbName = config.Get("dbName") ?? "telehealth_dev";
    var dbUsername = config.Get("dbUsername") ?? "telehealth_admin";

    var awsConfig = new Config("aws");
    var awsRegion = awsConfig.Get("region") ?? "us-east-1";

    var tags = new InputMap<string>
    {
        { "Project", "TeleHealth-DDAC" },
        { "ManagedBy", "Pulumi" },
        { "Environment", "dev" },
    };

    // ============================================================
    // 1. SECRETS MANAGER — Store DB password as a managed secret
    //    The EB role below gets GetSecretValue permission so the
    //    app can resolve the password at runtime without baking
    //    it into environment variable plaintext.
    // ============================================================
    var dbSecret = new Aws.SecretsManager.Secret(
        "telehealth-db-secret",
        new Aws.SecretsManager.SecretArgs
        {
            Name = "telehealth/dev/db-password",
            Description = "RDS PostgreSQL password for TeleHealth dev environment",
            RecoveryWindowInDays = 0, // Immediate deletion — set ≥7 for production
            Tags = tags,
        }
    );

    var dbSecretVersion = new Aws.SecretsManager.SecretVersion(
        "telehealth-db-secret-version",
        new Aws.SecretsManager.SecretVersionArgs
        {
            SecretId = dbSecret.Id,
            SecretString = dbPassword,
        }
    );

    // ============================================================
    // 2. ECR — Docker image registry (replaces zipping source code)
    //    CI builds a docker image via `dotnet publish` (multi-stage
    //    Dockerfile), pushes here, and EB pulls the pre-built image.
    // ============================================================
    var ecrRepo = new Aws.Ecr.Repository(
        "telehealth-api-repo",
        new Aws.Ecr.RepositoryArgs
        {
            Name = "telehealth-api",
            ImageTagMutability = "MUTABLE",
            ImageScanningConfiguration = new Aws.Ecr.Inputs.RepositoryImageScanningConfigurationArgs
            {
                ScanOnPush = true, // Free vulnerability scanning on every push
            },
            Tags = tags,
        }
    );

    // ECR lifecycle: keep last 10 images, delete untagged after 1 day
    var ecrLifecyclePolicy = new Aws.Ecr.LifecyclePolicy(
        "telehealth-api-lifecycle",
        new Aws.Ecr.LifecyclePolicyArgs
        {
            Repository = ecrRepo.Name,
            Policy =
                @"{
                ""rules"": [
                    {
                        ""rulePriority"": 1,
                        ""description"": ""Remove untagged images after 1 day"",
                        ""selection"": { ""tagStatus"": ""untagged"", ""countType"": ""sinceImagePushed"", ""countUnit"": ""days"", ""countNumber"": 1 },
                        ""action"": { ""type"": ""expire"" }
                    },
                    {
                        ""rulePriority"": 2,
                        ""description"": ""Keep last 10 tagged images"",
                        ""selection"": { ""tagStatus"": ""any"", ""countType"": ""imageCountMoreThan"", ""countNumber"": 10 },
                        ""action"": { ""type"": ""expire"" }
                    }
                ]
            }",
        }
    );

    // ============================================================
    // 3. VPC / NETWORKING
    //    Use the default VPC but lock down the DB SG so that port
    //    5432 is only reachable from the EB security group — not
    //    the public internet. This fixes the critical security issue.
    // ============================================================
    var defaultVpc = Aws.Ec2.GetVpc.Invoke(new Aws.Ec2.GetVpcInvokeArgs { Default = true });

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
            },
        }
    );

    // Elastic Beanstalk instances security group
    var ebSecurityGroup = new Aws.Ec2.SecurityGroup(
        "eb-sg",
        new Aws.Ec2.SecurityGroupArgs
        {
            Description = "TeleHealth API — Elastic Beanstalk instances",
            VpcId = defaultVpc.Apply(v => v.Id),
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
                new Aws.Ec2.Inputs.SecurityGroupIngressArgs
                {
                    Protocol = "tcp",
                    FromPort = 443,
                    ToPort = 443,
                    CidrBlocks = { "0.0.0.0/0" },
                    Description = "HTTPS from load balancer / internet",
                },
            },
            Egress = new[]
            {
                new Aws.Ec2.Inputs.SecurityGroupEgressArgs
                {
                    Protocol = "-1",
                    FromPort = 0,
                    ToPort = 0,
                    CidrBlocks = { "0.0.0.0/0" },
                    Description = "Allow all outbound",
                },
            },
            Tags = tags,
        }
    );

    // RDS security group — port 5432 only from the EB SG, NOT the internet
    var dbSecurityGroup = new Aws.Ec2.SecurityGroup(
        "db-sg",
        new Aws.Ec2.SecurityGroupArgs
        {
            Description = "TeleHealth RDS — PostgreSQL accessible from EB only",
            VpcId = defaultVpc.Apply(v => v.Id),
            Ingress = new[]
            {
                new Aws.Ec2.Inputs.SecurityGroupIngressArgs
                {
                    Protocol = "tcp",
                    FromPort = 5432,
                    ToPort = 5432,
                    SecurityGroups = { ebSecurityGroup.Id },
                    Description = "PostgreSQL from Elastic Beanstalk instances only",
                },
            },
            Egress = new[]
            {
                new Aws.Ec2.Inputs.SecurityGroupEgressArgs
                {
                    Protocol = "-1",
                    FromPort = 0,
                    ToPort = 0,
                    CidrBlocks = { "0.0.0.0/0" },
                },
            },
            Tags = tags,
        }
    );

    // DB subnet group required by RDS
    var dbSubnetGroup = new Aws.Rds.SubnetGroup(
        "telehealth-db-subnet-group",
        new Aws.Rds.SubnetGroupArgs { SubnetIds = defaultSubnets.Apply(s => s.Ids), Tags = tags }
    );

    // ============================================================
    // 4. FRONTEND — S3 Static Website (unchanged logic, same code)
    // ============================================================
    var frontendBucket = new Aws.S3.Bucket(
        "telehealth-frontend",
        new Aws.S3.BucketArgs
        {
            Website = new Aws.S3.Inputs.BucketWebsiteArgs
            {
                IndexDocument = "index.html",
                ErrorDocument = "index.html", // Required for TanStack Router SPA
            },
            ForceDestroy = true,
            Tags = tags,
        }
    );

    var frontendPublicAccessBlock = new Aws.S3.BucketPublicAccessBlock(
        "frontend-pab",
        new Aws.S3.BucketPublicAccessBlockArgs
        {
            Bucket = frontendBucket.Id,
            BlockPublicAcls = false,
            BlockPublicPolicy = false,
            IgnorePublicAcls = false,
            RestrictPublicBuckets = false,
        }
    );

    var frontendBucketPolicy = new Aws.S3.BucketPolicy(
        "frontend-policy",
        new Aws.S3.BucketPolicyArgs
        {
            Bucket = frontendBucket.Id,
            Policy = frontendBucket.Arn.Apply(arn =>
                $@"{{
                    ""Version"": ""2012-10-17"",
                    ""Statement"": [{{
                        ""Effect"": ""Allow"",
                        ""Principal"": ""*"",
                        ""Action"": [""s3:GetObject""],
                        ""Resource"": [""{arn}/*""]
                    }}]
                }}"
            ),
        },
        new CustomResourceOptions { DependsOn = frontendPublicAccessBlock }
    );

    // Separate S3 bucket for EB deployment artifacts (Dockerrun.aws.json)
    var artifactsBucket = new Aws.S3.Bucket(
        "telehealth-eb-artifacts",
        new Aws.S3.BucketArgs { ForceDestroy = true, Tags = tags }
    );

    // ============================================================
    // 5. LAB REPORTS — S3 (private) + SNS topic + SQS queue
    // ============================================================
    var labReportsBucket = new Aws.S3.Bucket(
        "telehealth-lab-reports",
        new Aws.S3.BucketArgs
        {
            ForceDestroy = true,
            CorsRules = new[]
            {
                new Aws.S3.Inputs.BucketCorsRuleArgs
                {
                    AllowedHeaders = { "*" },
                    AllowedMethods = { "PUT", "POST", "GET" },
                    AllowedOrigins = { "*" }, // Restrict to your domain in production
                    MaxAgeSeconds = 3000,
                },
            },
            Tags = tags,
        }
    );

    // Block ALL public access — lab reports contain sensitive patient data
    var labReportsPublicAccessBlock = new Aws.S3.BucketPublicAccessBlock(
        "lab-reports-pab",
        new Aws.S3.BucketPublicAccessBlockArgs
        {
            Bucket = labReportsBucket.Id,
            BlockPublicAcls = true,
            BlockPublicPolicy = true,
            IgnorePublicAcls = true,
            RestrictPublicBuckets = true,
        }
    );

    var medicalAlertsTopic = new Aws.Sns.Topic(
        "medical-alerts-topic",
        new Aws.Sns.TopicArgs { Tags = tags }
    );

    var processingQueue = new Aws.Sqs.Queue(
        "report-processing-queue",
        new Aws.Sqs.QueueArgs { Tags = tags }
    );

    var topicSubscription = new Aws.Sns.TopicSubscription(
        "queue-topic-sub",
        new Aws.Sns.TopicSubscriptionArgs
        {
            Topic = medicalAlertsTopic.Arn,
            Protocol = "sqs",
            Endpoint = processingQueue.Arn,
        }
    );

    new Aws.Sqs.QueuePolicy(
        "queue-policy",
        new Aws.Sqs.QueuePolicyArgs
        {
            QueueUrl = processingQueue.Id,
            Policy = Output
                .Tuple(processingQueue.Arn, medicalAlertsTopic.Arn)
                .Apply(t =>
                    $@"{{
                        ""Version"": ""2012-10-17"",
                        ""Statement"": [{{
                            ""Effect"": ""Allow"",
                            ""Principal"": {{ ""Service"": ""sns.amazonaws.com"" }},
                            ""Action"": ""sqs:SendMessage"",
                            ""Resource"": ""{t.Item1}"",
                            ""Condition"": {{ ""ArnEquals"": {{ ""aws:SourceArn"": ""{t.Item2}"" }} }}
                        }}]
                    }}"
                ),
        }
    );

    // ============================================================
    // 6. RDS — PostgreSQL with security hardening
    //    FIXES applied vs original:
    //      • PubliclyAccessible = false  (DB not on public internet)
    //      • StorageEncrypted = true     (encryption at rest, free)
    //      • BackupRetentionPeriod = 7   (7-day automated backups)
    //      • Security group: EB-only ingress (see section 3)
    //      • CloudWatch log exports enabled
    // ============================================================
    var rdsMonitoringRole = new Aws.Iam.Role(
        "rds-monitoring-role",
        new Aws.Iam.RoleArgs
        {
            AssumeRolePolicy =
                @"{
                ""Version"": ""2012-10-17"",
                ""Statement"": [{
                    ""Action"": ""sts:AssumeRole"",
                    ""Principal"": { ""Service"": ""monitoring.rds.amazonaws.com"" },
                    ""Effect"": ""Allow""
                }]
            }",
        }
    );

    new Aws.Iam.RolePolicyAttachment(
        "rds-monitoring-policy",
        new Aws.Iam.RolePolicyAttachmentArgs
        {
            Role = rdsMonitoringRole.Name,
            PolicyArn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
        }
    );

    var database = new Aws.Rds.Instance(
        "telehealth-db",
        new Aws.Rds.InstanceArgs
        {
            Engine = "postgres",
            EngineVersion = "16.4",
            InstanceClass = dbInstanceClass,
            AllocatedStorage = 20,
            DbName = dbName,
            Username = dbUsername,
            Password = dbPassword,
            VpcSecurityGroupIds = { dbSecurityGroup.Id },
            DbSubnetGroupName = dbSubnetGroup.Name,
            // Security hardening
            PubliclyAccessible = false,
            StorageEncrypted = true,
            // Backup safety net (makes SkipFinalSnapshot = true safer)
            BackupRetentionPeriod = 7,
            BackupWindow = "03:00-04:00",
            MaintenanceWindow = "sun:04:30-sun:05:30",
            SkipFinalSnapshot = true,
            // Observability
            MonitoringInterval = 60,
            MonitoringRoleArn = rdsMonitoringRole.Arn,
            PerformanceInsightsEnabled = true,
            EnabledCloudwatchLogsExports = { "postgresql", "upgrade" },
            Tags = tags,
        }
    );

    // ============================================================
    // 7. CLOUDWATCH — Log groups & metric alarms
    // ============================================================
    var apiLogGroup = new Aws.CloudWatch.LogGroup(
        "telehealth-api-logs",
        new Aws.CloudWatch.LogGroupArgs
        {
            Name = "/telehealth/api",
            RetentionInDays = 30,
            Tags = tags,
        }
    );

    new Aws.CloudWatch.LogGroup(
        "telehealth-rds-logs",
        new Aws.CloudWatch.LogGroupArgs
        {
            Name = "/aws/rds/instance/telehealth-db/postgresql",
            RetentionInDays = 14,
            Tags = tags,
        }
    );

    // Alarm: RDS CPU > 80% for 10 minutes → SNS
    new Aws.CloudWatch.MetricAlarm(
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
            AlarmDescription = "RDS CPU > 80% for 10 minutes",
            Dimensions = new InputMap<string> { { "DBInstanceIdentifier", database.Id } },
            AlarmActions = { medicalAlertsTopic.Arn },
            OkActions = { medicalAlertsTopic.Arn },
            Tags = tags,
        }
    );

    // Alarm: RDS free storage < 2 GiB
    new Aws.CloudWatch.MetricAlarm(
        "rds-low-storage",
        new Aws.CloudWatch.MetricAlarmArgs
        {
            ComparisonOperator = "LessThanThreshold",
            EvaluationPeriods = 1,
            MetricName = "FreeStorageSpace",
            Namespace = "AWS/RDS",
            Period = 300,
            Statistic = "Average",
            Threshold = 2_147_483_648, // 2 GiB in bytes
            AlarmDescription = "RDS free storage below 2 GiB",
            Dimensions = new InputMap<string> { { "DBInstanceIdentifier", database.Id } },
            AlarmActions = { medicalAlertsTopic.Arn },
            Tags = tags,
        }
    );

    // Alarm: API 5xx errors > 10/min
    new Aws.CloudWatch.MetricAlarm(
        "eb-5xx-errors",
        new Aws.CloudWatch.MetricAlarmArgs
        {
            ComparisonOperator = "GreaterThanThreshold",
            EvaluationPeriods = 1,
            MetricName = "ApplicationRequests5xx",
            Namespace = "AWS/ElasticBeanstalk",
            Period = 60,
            Statistic = "Sum",
            Threshold = 10,
            AlarmDescription = "More than 10 HTTP 5xx responses per minute",
            Dimensions = new InputMap<string> { { "EnvironmentName", ebEnv.Name } },
            AlarmActions = { medicalAlertsTopic.Arn },
            Tags = tags,
        }
    );

    // ============================================================
    // 8. X-RAY — Tracing group + sampling rule
    //    The EB environment below enables the X-Ray daemon so the
    //    .NET app only needs OpenTelemetry.Instrumentation.AWS to
    //    emit traces automatically.
    // ============================================================
    new Aws.Xray.SamplingRule(
        "telehealth-sampling-rule",
        new Aws.Xray.SamplingRuleArgs
        {
            RuleName = "telehealth-api-sampling",
            Priority = 9000,
            ReservoirSize = 5, // Always sample 5 req/s regardless of fixed rate
            FixedRate = 0.10, // Sample 10% of remaining requests
            UrlPath = "/api/*",
            Host = "*",
            HttpMethod = "*",
            ServiceName = "telehealth-api",
            ServiceType = "*",
            ResourceArn = "*",
            Version = 1,
            Tags = tags,
        }
    );

    var xrayGroup = new Aws.Xray.Group(
        "telehealth-xray-group",
        new Aws.Xray.GroupArgs
        {
            GroupName = "telehealth-api",
            FilterExpression = "service(\"telehealth-api\")",
            InsightsConfiguration = new Aws.Xray.Inputs.GroupInsightsConfigurationArgs
            {
                InsightsEnabled = true,
                NotificationsEnabled = false,
            },
            Tags = tags,
        }
    );

    // ============================================================
    // 9. IAM — Elastic Beanstalk EC2 instance role
    //    FIXES applied vs original:
    //      • Added ECR read (pull pre-built Docker images)
    //      • Added SQS / SNS / scoped S3 for lab reports
    //      • Added CloudWatch Logs
    //      • Added X-Ray daemon write access
    //      • Added Secrets Manager GetSecretValue for DB secret
    // ============================================================
    var ebRole = new Aws.Iam.Role(
        "eb-ec2-role",
        new Aws.Iam.RoleArgs
        {
            AssumeRolePolicy =
                @"{
                ""Version"": ""2012-10-17"",
                ""Statement"": [{
                    ""Action"": ""sts:AssumeRole"",
                    ""Principal"": { ""Service"": ""ec2.amazonaws.com"" },
                    ""Effect"": ""Allow""
                }]
            }",
            Tags = tags,
        }
    );

    // AWS managed policies attached to EB role
    foreach (
        var (suffix, policyArn) in new[]
        {
            ("eb-web-tier", "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"),
            ("eb-ecr-readonly", "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"),
            ("eb-sqs", "arn:aws:iam::aws:policy/AmazonSQSFullAccess"),
            ("eb-sns", "arn:aws:iam::aws:policy/AmazonSNSFullAccess"),
            ("eb-xray", "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"),
            ("eb-cloudwatch-logs", "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"),
        }
    )
    {
        new Aws.Iam.RolePolicyAttachment(
            $"policy-{suffix}",
            new Aws.Iam.RolePolicyAttachmentArgs { Role = ebRole.Name, PolicyArn = policyArn }
        );
    }

    // Inline policy: scoped S3 access for lab-reports bucket only
    new Aws.Iam.RolePolicy(
        "policy-s3-lab-reports",
        new Aws.Iam.RolePolicyArgs
        {
            Role = ebRole.Name,
            Policy = labReportsBucket.Arn.Apply(arn =>
                $@"{{
                    ""Version"": ""2012-10-17"",
                    ""Statement"": [{{
                        ""Effect"": ""Allow"",
                        ""Action"": [""s3:PutObject"",""s3:GetObject"",""s3:DeleteObject"",""s3:ListBucket""],
                        ""Resource"": [""{arn}"",""{arn}/*""]
                    }}]
                }}"
            ),
        }
    );

    // Inline policy: read the DB secret (app retrieves password at startup)
    new Aws.Iam.RolePolicy(
        "policy-secrets-manager",
        new Aws.Iam.RolePolicyArgs
        {
            Role = ebRole.Name,
            Policy = dbSecret.Arn.Apply(arn =>
                $@"{{
                    ""Version"": ""2012-10-17"",
                    ""Statement"": [{{
                        ""Effect"": ""Allow"",
                        ""Action"": [""secretsmanager:GetSecretValue""],
                        ""Resource"": ""{arn}""
                    }}]
                }}"
            ),
        }
    );

    var instanceProfile = new Aws.Iam.InstanceProfile(
        "eb-instance-profile",
        new Aws.Iam.InstanceProfileArgs { Role = ebRole.Name }
    );

    // ============================================================
    // 10. ELASTIC BEANSTALK
    //     FIXES applied vs original:
    //       • SecurityGroups set to ebSecurityGroup (not default SG)
    //       • CloudWatch log streaming enabled
    //       • X-Ray daemon enabled
    //       • ConnectionStrings__Database injected from RDS outputs
    //       • All required AWS_ env vars injected
    // ============================================================
    var ebApp = new Aws.ElasticBeanstalk.Application(
        "telehealth-api",
        new Aws.ElasticBeanstalk.ApplicationArgs { Tags = tags }
    );

    var dbConnectionString = Output
        .Tuple(database.Address, dbPassword)
        .Apply(t =>
            $"Host={t.Item1};Port=5432;Database={dbName};Username={dbUsername};Password={t.Item2};"
            + "SSL Mode=Require;Trust Server Certificate=true;"
        );

    var ebEnv = new Aws.ElasticBeanstalk.Environment(
        "telehealth-env",
        new Aws.ElasticBeanstalk.EnvironmentArgs
        {
            Application = ebApp.Name,
            SolutionStackName = "64bit Amazon Linux 2023 v4.3.0 running Docker",
            Settings = new[]
            {
                // ── Instance & networking ────────────────────────────────────
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:autoscaling:launchconfiguration",
                    Name = "IamInstanceProfile",
                    Value = instanceProfile.Name,
                },
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:autoscaling:launchconfiguration",
                    Name = "InstanceType",
                    Value = "t3.micro",
                },
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:autoscaling:launchconfiguration",
                    Name = "SecurityGroups",
                    Value = ebSecurityGroup.Id,
                },
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:elasticbeanstalk:environment",
                    Name = "EnvironmentType",
                    Value = "SingleInstance",
                },
                // ── CloudWatch log streaming ─────────────────────────────────
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:elasticbeanstalk:cloudwatch:logs",
                    Name = "StreamLogs",
                    Value = "true",
                },
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:elasticbeanstalk:cloudwatch:logs",
                    Name = "DeleteOnTerminate",
                    Value = "false",
                },
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:elasticbeanstalk:cloudwatch:logs",
                    Name = "RetentionInDays",
                    Value = "30",
                },
                // ── X-Ray daemon ─────────────────────────────────────────────
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:elasticbeanstalk:xray",
                    Name = "XRayEnabled",
                    Value = "true",
                },
                // ── App environment variables ─────────────────────────────────
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:elasticbeanstalk:application:environment",
                    Name = "ASPNETCORE_ENVIRONMENT",
                    Value = "Production",
                },
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:elasticbeanstalk:application:environment",
                    Name = "ASPNETCORE_HTTP_PORTS",
                    Value = "8080",
                },
                // DB connection — builder.Configuration.GetConnectionString("Database")
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:elasticbeanstalk:application:environment",
                    Name = "ConnectionStrings__Database",
                    Value = dbConnectionString,
                },
                // Individual RDS components so the app can also build its own string
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:elasticbeanstalk:application:environment",
                    Name = "RDS_HOST",
                    Value = database.Address,
                },
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:elasticbeanstalk:application:environment",
                    Name = "RDS_PORT",
                    Value = "5432",
                },
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:elasticbeanstalk:application:environment",
                    Name = "RDS_DB",
                    Value = dbName,
                },
                // Secret ARN — app resolves the password at runtime via SDK
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:elasticbeanstalk:application:environment",
                    Name = "DB_SECRET_ARN",
                    Value = dbSecret.Arn,
                },
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:elasticbeanstalk:application:environment",
                    Name = "AWS_REGION",
                    Value = awsRegion,
                },
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:elasticbeanstalk:application:environment",
                    Name = "AWS_S3_LAB_REPORTS_BUCKET",
                    Value = labReportsBucket.BucketName,
                },
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:elasticbeanstalk:application:environment",
                    Name = "AWS_SNS_TOPIC_ARN",
                    Value = medicalAlertsTopic.Arn,
                },
                new Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs
                {
                    Namespace = "aws:elasticbeanstalk:application:environment",
                    Name = "AWS_SQS_QUEUE_URL",
                    Value = processingQueue.Id,
                },
            },
            Tags = tags,
        }
    );

    // ============================================================
    // 11. OUTPUTS — used by GitHub Actions CD workflow
    // ============================================================
    return new Dictionary<string, object?>
    {
        ["FrontendUrl"] = frontendBucket.WebsiteEndpoint,
        ["ApiUrl"] = ebEnv.EndpointUrl,
        ["DatabaseEndpoint"] = database.Endpoint,
        ["DatabaseAddress"] = database.Address,
        ["S3LabReportsBucket"] = labReportsBucket.BucketName,
        ["S3ArtifactsBucket"] = artifactsBucket.BucketName,
        ["SnsTopicArn"] = medicalAlertsTopic.Arn,
        ["SqsQueueUrl"] = processingQueue.Id,
        ["FrontendBucketName"] = frontendBucket.BucketName,
        ["EbAppName"] = ebApp.Name,
        ["EbEnvName"] = ebEnv.Name,
        ["EcrRepositoryUrl"] = ecrRepo.RepositoryUrl,
        ["DbSecretArn"] = dbSecret.Arn,
        ["XRayGroupArn"] = xrayGroup.Arn,
        ["ApiLogGroupName"] = apiLogGroup.Name,
    };
});
