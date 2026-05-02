namespace TeleHealth.Infra;

using Pulumi;
using Aws = Pulumi.Aws;

/// <summary>
/// ECR repository, IAM role with scoped policies, instance profile,
/// and Elastic Beanstalk application + environment.
///
/// IAM follows least-privilege: only managed policies for broad AWS
/// service integration (EB Web Tier, ECR read, X-Ray), with scoped
/// inline policies for SQS, SNS, CloudWatch Logs, S3, and Secrets Manager.
/// </summary>
public static class Compute
{
    public sealed class Result
    {
        public required Aws.Ecr.Repository EcrRepo { get; init; }
        public required Aws.ElasticBeanstalk.Application EbApp { get; init; }
        public required Aws.ElasticBeanstalk.Environment EbEnv { get; init; }
    }

    public static Result Create(
        StackConfig cfg,
        Networking.Result net,
        Storage.Result storage,
        Database.Result db,
        Messaging.Result msg,
        Observability.Result obs
    )
    {
        // ── ECR — Docker image registry ──
        var ecrRepo = new Aws.Ecr.Repository(
            "telehealth-api-repo",
            new Aws.Ecr.RepositoryArgs
            {
                Name = $"telehealth-api-{cfg.StackName}",
                ImageTagMutability = "MUTABLE",
                ImageScanningConfiguration =
                    new Aws.Ecr.Inputs.RepositoryImageScanningConfigurationArgs
                    {
                        ScanOnPush = true,
                    },
                Tags = cfg.Tags,
            }
        );

        _ = new Aws.Ecr.LifecyclePolicy(
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

        // ── IAM — EB EC2 instance role ──
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
                Tags = cfg.Tags,
            }
        );

        // Managed policies — only for broad AWS-service integration
        foreach (
            var (suffix, policyArn) in new[]
            {
                ("eb-web-tier", "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"),
                ("eb-ecr-readonly", "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"),
                ("eb-xray", "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"),
            }
        )
        {
            _ = new Aws.Iam.RolePolicyAttachment(
                $"policy-{suffix}",
                new Aws.Iam.RolePolicyAttachmentArgs { Role = ebRole.Name, PolicyArn = policyArn }
            );
        }

        // Scoped inline policy: SQS — only the processing queue
        _ = new Aws.Iam.RolePolicy(
            "policy-sqs-scoped",
            new Aws.Iam.RolePolicyArgs
            {
                Role = ebRole.Name,
                Policy = msg.ProcessingQueue.Arn.Apply(queueArn =>
                    $@"{{
                        ""Version"": ""2012-10-17"",
                        ""Statement"": [{{
                            ""Effect"": ""Allow"",
                            ""Action"": [""sqs:SendMessage"",""sqs:ReceiveMessage"",""sqs:DeleteMessage"",""sqs:GetQueueAttributes""],
                            ""Resource"": ""{queueArn}""
                        }}]
                    }}"
                ),
            }
        );

        // Scoped inline policy: SNS — only the medical alerts topic
        _ = new Aws.Iam.RolePolicy(
            "policy-sns-scoped",
            new Aws.Iam.RolePolicyArgs
            {
                Role = ebRole.Name,
                Policy = msg.MedicalAlertsTopic.Arn.Apply(topicArn =>
                    $@"{{
                        ""Version"": ""2012-10-17"",
                        ""Statement"": [{{
                            ""Effect"": ""Allow"",
                            ""Action"": [""sns:Publish""],
                            ""Resource"": ""{topicArn}""
                        }}]
                    }}"
                ),
            }
        );

        // Scoped inline policy: CloudWatch Logs — only the API log group
        _ = new Aws.Iam.RolePolicy(
            "policy-cloudwatch-logs-scoped",
            new Aws.Iam.RolePolicyArgs
            {
                Role = ebRole.Name,
                Policy = obs.ApiLogGroup.Arn.Apply(logGroupArn =>
                    $@"{{
                        ""Version"": ""2012-10-17"",
                        ""Statement"": [{{
                            ""Effect"": ""Allow"",
                            ""Action"": [""logs:CreateLogStream"",""logs:PutLogEvents"",""logs:DescribeLogStreams""],
                            ""Resource"": [""{logGroupArn}"",""{logGroupArn}:*""]
                        }}]
                    }}"
                ),
            }
        );

        // Scoped inline policy: S3 — only the lab-reports bucket
        _ = new Aws.Iam.RolePolicy(
            "policy-s3-lab-reports",
            new Aws.Iam.RolePolicyArgs
            {
                Role = ebRole.Name,
                Policy = storage.LabReportsBucket.Arn.Apply(arn =>
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

        // Scoped inline policy: Secrets Manager — only the DB secret
        _ = new Aws.Iam.RolePolicy(
            "policy-secrets-manager",
            new Aws.Iam.RolePolicyArgs
            {
                Role = ebRole.Name,
                Policy = db.DbSecret.Arn.Apply(arn =>
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

        // Scoped inline policy: SES send email for appointment reminder feature
        _ = new Aws.Iam.RolePolicy(
            "policy-ses-scoped",
            new Aws.Iam.RolePolicyArgs
            {
                Role = ebRole.Name,
                Policy =
                    @"{
                        ""Version"": ""2012-10-17"",
                        ""Statement"": [{
                            ""Effect"": ""Allow"",
                            ""Action"": [""ses:SendEmail"", ""ses:SendRawEmail""],
                            ""Resource"": ""*""
                        }]
                    }",
            }
        );

        var instanceProfile = new Aws.Iam.InstanceProfile(
            "eb-instance-profile",
            new Aws.Iam.InstanceProfileArgs { Role = ebRole.Name }
        );

        // ── Elastic Beanstalk ──
        var ebApp = new Aws.ElasticBeanstalk.Application(
            "telehealth-api",
            new Aws.ElasticBeanstalk.ApplicationArgs { Tags = cfg.Tags }
        );

        var ebEnv = new Aws.ElasticBeanstalk.Environment(
            "telehealth-env",
            new Aws.ElasticBeanstalk.EnvironmentArgs
            {
                Application = ebApp.Name,
                SolutionStackName = "64bit Amazon Linux 2023 v4.12.1 running Docker",
                Settings = new[]
                {
                    // -- Instance & networking --
                    EbSetting(
                        "aws:autoscaling:launchconfiguration",
                        "IamInstanceProfile",
                        instanceProfile.Name
                    ),
                    EbSetting("aws:autoscaling:launchconfiguration", "InstanceType", "t3.micro"),
                    EbSetting(
                        "aws:autoscaling:launchconfiguration",
                        "SecurityGroups",
                        net.EbSecurityGroup.Id
                    ),
                    EbSetting(
                        "aws:elasticbeanstalk:environment",
                        "EnvironmentType",
                        "SingleInstance"
                    ),
                    // -- CloudWatch log streaming --
                    EbSetting("aws:elasticbeanstalk:cloudwatch:logs", "StreamLogs", "true"),
                    EbSetting("aws:elasticbeanstalk:cloudwatch:logs", "DeleteOnTerminate", "false"),
                    EbSetting("aws:elasticbeanstalk:cloudwatch:logs", "RetentionInDays", "30"),
                    // -- X-Ray daemon --
                    EbSetting("aws:elasticbeanstalk:xray", "XRayEnabled", "true"),
                    // -- App environment variables --
                    EbEnvVar("ASPNETCORE_ENVIRONMENT", "Production"),
                    EbEnvVar("ASPNETCORE_HTTP_PORTS", "8080"),
                    EbEnvVar(
                        "Cors__AllowedOrigins",
                        storage.FrontendBucket.WebsiteEndpoint.Apply(ep => $"http://{ep}")
                    ),
                    // DB connection — app resolves password from Secrets Manager at runtime
                    EbEnvVar("RDS_HOST", db.Instance.Address),
                    EbEnvVar("RDS_PORT", "5432"),
                    EbEnvVar("RDS_DB", cfg.DbName),
                    EbEnvVar("RDS_USERNAME", cfg.DbUsername),
                    EbEnvVar("DB_SECRET_ARN", db.DbSecret.Arn),
                    // AWS service references
                    EbEnvVar("AWS_REGION", cfg.AwsRegion),
                    EbEnvVar("AWS_S3_LAB_REPORTS_BUCKET", storage.LabReportsBucket.BucketName),
                    EbEnvVar("AWS_SNS_TOPIC_ARN", msg.MedicalAlertsTopic.Arn),
                    EbEnvVar("AWS_SQS_QUEUE_URL", msg.ProcessingQueue.Id),
                    EbEnvVar("SES_SENDER_EMAIL", "hongjx0321@gmail.com"),
                    EbEnvVar("SES_REGION", "us-east-1"),
                    // -- VPC placement --
                    EbSetting("aws:ec2:vpc", "VPCId", net.VpcId),
                    EbSetting(
                        "aws:ec2:vpc",
                        "Subnets",
                        net.SubnetIds.Apply(ids => string.Join(",", ids))
                    ),
                },
                Tags = cfg.Tags,
            }
        );

        return new Result
        {
            EcrRepo = ecrRepo,
            EbApp = ebApp,
            EbEnv = ebEnv,
        };
    }

    // Helper to reduce EB setting boilerplate
    private static Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs EbSetting(
        string ns,
        string name,
        Input<string> value
    ) =>
        new()
        {
            Namespace = ns,
            Name = name,
            Value = value,
        };

    private static Aws.ElasticBeanstalk.Inputs.EnvironmentSettingArgs EbEnvVar(
        string name,
        Input<string> value
    ) => EbSetting("aws:elasticbeanstalk:application:environment", name, value);
}
