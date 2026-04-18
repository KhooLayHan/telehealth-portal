// TODO: WIP: Do not use yet

using System.Collections.Generic;
using Pulumi;
using Aws = Pulumi.Aws;

return await Deployment.RunAsync(() =>
{
    // 1. Read Configurations
    var config = new Config("telehealth");
    var dbPassword = config.RequireSecret("dbPassword");
    var dbInstanceClass = config.Get("dbInstanceClass") ?? "db.t4g.micro";
    var dbName = config.Get("dbName") ?? "telehealth_dev";
    var dbUsername = config.Get("dbUsername") ?? "telehealth_admin";

    var tags = new Dictionary<string, string> { { "Project", "TeleHealth-DDAC" } };

    // ==========================================
    // 2. FRONTEND: Amazon S3 Static Website Hosting
    // ==========================================
    var frontendBucket = new Aws.S3.Bucket(
        "telehealth-frontend",
        new Aws.S3.BucketArgs
        {
            Website = new Aws.S3.Inputs.BucketWebsiteArgs
            {
                IndexDocument = "index.html",
                ErrorDocument = "index.html", // Crucial for TanStack Router SPAs!
            },
            ForceDestroy = true, // Allows easy deletion after the semester ends
            Tags = tags,
        }
    );

    // Make the frontend bucket publicly readable
    var publicAccessBlock = new Aws.S3.BucketPublicAccessBlock(
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

    var bucketPolicy = new Aws.S3.BucketPolicy(
        "frontend-policy",
        new Aws.S3.BucketPolicyArgs
        {
            Bucket = frontendBucket.Id,
            Policy = frontendBucket.Arn.Apply(arn =>
                @$"{{
            ""Version"": ""2012-10-17"",
            ""Statement"":[{{
                ""Effect"": ""Allow"",
                ""Principal"": ""*"",
                ""Action"":[""s3:GetObject""],
                ""Resource"": [""{arn}/*""]
            }}]
        }}"
            ),
        },
        new CustomResourceOptions { DependsOn = publicAccessBlock }
    );

    // ==========================================
    // 3. TASK 2 MICROSERVICES: Lab Reports S3 & SNS/SQS
    // ==========================================
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
                    AllowedOrigins = { "*" }, // In prod, restrict this to your frontend URL!
                    MaxAgeSeconds = 3000,
                },
            },
            Tags = tags,
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

    var queuePolicy = new Aws.Sqs.QueuePolicy(
        "queue-policy",
        new Aws.Sqs.QueuePolicyArgs
        {
            QueueUrl = processingQueue.Id,
            Policy = Output
                .Tuple(processingQueue.Arn, medicalAlertsTopic.Arn)
                .Apply(t =>
                    @$"{{
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

    // ==========================================
    // 4. TASK 1 DATABASE: Amazon RDS PostgreSQL
    // ==========================================
    var dbSecurityGroup = new Aws.Ec2.SecurityGroup(
        "db-sg",
        new Aws.Ec2.SecurityGroupArgs
        {
            Description = "Allow PostgreSQL traffic",
            Ingress = new[]
            {
                new Aws.Ec2.Inputs.SecurityGroupIngressArgs
                {
                    Protocol = "tcp",
                    FromPort = 5432,
                    ToPort = 5432,
                    CidrBlocks = { "0.0.0.0/0" },
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
            SkipFinalSnapshot = true,
            PubliclyAccessible = true, // Crucial for your team to connect from home!
            Tags = tags,
        }
    );

    // ==========================================
    // 5. TASK 1 BACKEND: Elastic Beanstalk (Docker)
    // ==========================================
    var ebApp = new Aws.ElasticBeanstalk.Application(
        "telehealth-api",
        new Aws.ElasticBeanstalk.ApplicationArgs { Tags = tags }
    );

    // EB needs an IAM Role to run the EC2 instances
    var ebRole = new Aws.Iam.Role(
        "eb-ec2-role",
        new Aws.Iam.RoleArgs
        {
            AssumeRolePolicy =
                @"{
            ""Version"": ""2012-10-17"",
            ""Statement"":[{ ""Action"": ""sts:AssumeRole"", ""Principal"": { ""Service"": ""ec2.amazonaws.com"" }, ""Effect"": ""Allow"" }]
        }",
        }
    );

    var ebRolePolicy = new Aws.Iam.RolePolicyAttachment(
        "eb-ec2-role-policy",
        new Aws.Iam.RolePolicyAttachmentArgs
        {
            Role = ebRole.Name,
            PolicyArn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier",
        }
    );

    var instanceProfile = new Aws.Iam.InstanceProfile(
        "eb-instance-profile",
        new Aws.Iam.InstanceProfileArgs { Role = ebRole.Name }
    );

    var ebEnv = new Aws.ElasticBeanstalk.Environment(
        "telehealth-env",
        new Aws.ElasticBeanstalk.EnvironmentArgs
        {
            Application = ebApp.Name,
            SolutionStackName = "64bit Amazon Linux 2023 v4.3.0 running Docker", // Uses AWS AL2023 Docker environment!
            Settings = new[]
            {
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
                    Namespace = "aws:elasticbeanstalk:environment",
                    Name = "EnvironmentType",
                    Value = "SingleInstance",
                },
            },
            Tags = tags,
        }
    );

    // ==========================================
    // 6. OUTPUTS
    // ==========================================
    return new Dictionary<string, object?>
    {
        ["FrontendUrl"] = frontendBucket.WebsiteEndpoint,
        ["ApiUrl"] = ebEnv.EndpointUrl,
        ["DatabaseEndpoint"] = database.Endpoint,
        ["S3LabReportsBucket"] = labReportsBucket.BucketName,
        ["SnsTopicArn"] = medicalAlertsTopic.Arn,
        ["FrontendBucketName"] = frontendBucket.BucketName, // Needed for GitHub Actions
        ["EbAppName"] = ebApp.Name, // Needed for GitHub Actions
        ["EbEnvName"] = ebEnv.Name, // Needed for GitHub Actions
    };
});
