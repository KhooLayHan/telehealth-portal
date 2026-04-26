namespace TeleHealth.Infra;

using Pulumi;
using Aws = Pulumi.Aws;

/// <summary>
/// Lambda function for processing lab report PDFs.
/// Triggered by SQS messages from the lab-report processing queue.
///
/// Fixes applied:
///   - Runtime: dotnet10 (managed .NET 10 runtime, GA since Jan 2026)
///   - Scoped S3 read permission for lab reports bucket
///   - ReservedConcurrentExecutions to prevent overwhelming RDS
///   - Dummy zip placeholder for initial Pulumi creation (CI/CD overwrites)
/// </summary>
public static class Serverless
{
    public sealed class Result
    {
        public required Aws.Lambda.Function PdfProcessorLambda { get; init; }
        public required Aws.Lambda.Function ReminderLambda { get; init; }
    }

    public static Result Create(StackConfig cfg, Messaging.Result msg, Storage.Result storage)
    {
        // ── IAM role for Lambda ──
        var lambdaRole = new Aws.Iam.Role(
            "lambda-pdf-processor-role",
            new Aws.Iam.RoleArgs
            {
                AssumeRolePolicy =
                    @"{
                    ""Version"": ""2012-10-17"",
                    ""Statement"": [{
                        ""Action"": ""sts:AssumeRole"",
                        ""Principal"": { ""Service"": ""lambda.amazonaws.com"" },
                        ""Effect"": ""Allow""
                    }]
                }",
                Tags = cfg.Tags,
            }
        );

        // Managed policies: basic execution (CloudWatch Logs) + SQS polling
        _ = new Aws.Iam.RolePolicyAttachment(
            "lambda-basic-execution",
            new Aws.Iam.RolePolicyAttachmentArgs
            {
                Role = lambdaRole.Name,
                PolicyArn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            }
        );

        _ = new Aws.Iam.RolePolicyAttachment(
            "lambda-sqs-execution",
            new Aws.Iam.RolePolicyAttachmentArgs
            {
                Role = lambdaRole.Name,
                PolicyArn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole",
            }
        );

        // Scoped inline policy: S3 read access for lab reports bucket only
        _ = new Aws.Iam.RolePolicy(
            "lambda-s3-lab-reports",
            new Aws.Iam.RolePolicyArgs
            {
                Role = lambdaRole.Name,
                Policy = storage.LabReportsBucket.Arn.Apply(arn =>
                    $@"{{
                        ""Version"": ""2012-10-17"",
                        ""Statement"": [{{
                            ""Effect"": ""Allow"",
                            ""Action"": [""s3:GetObject""],
                            ""Resource"": ""{arn}/*""
                        }}]
                    }}"
                ),
            }
        );

        // ── Lambda function ──
        var pdfProcessorLambda = new Aws.Lambda.Function(
            "lab-pdf-processor",
            new Aws.Lambda.FunctionArgs
            {
                Name = $"telehealth-lab-pdf-processor-{cfg.StackName}",
                Role = lambdaRole.Arn,
                Runtime = "dotnet10",
                Handler =
                    "LabPdfProcessor-dev-ProcessPdfDocument::LabPdfProcessor_dev_ProcessPdfDocument.Function::FunctionHandler",
                MemorySize = 256,
                Timeout = 30,

                // Limit concurrency to prevent overwhelming RDS with connections
                ReservedConcurrentExecutions = 5,

                // Dummy deployment package — CI/CD overwrites with the real build.
                // This file must exist for Pulumi to create the Lambda resource.
                Code = new FileArchive("./dummy-lambda"),

                Environment = new Aws.Lambda.Inputs.FunctionEnvironmentArgs
                {
                    Variables = new InputMap<string>
                    {
                        { "ENVIRONMENT", cfg.StackName },
                        { "S3_LAB_REPORTS_BUCKET", storage.LabReportsBucket.BucketName },
                    },
                },
                Tags = cfg.Tags,
            },
            // Ignore code changes — CI/CD (Job 4) deploys the real artifact via
            // `aws lambda update-function-code`. Without this, every `pulumi up`
            // would revert the deployed code back to the dummy placeholder.
            new CustomResourceOptions { IgnoreChanges = { "sourceCodeHash" } }
        );

        // ── SQS event source mapping (triggers Lambda from the processing queue) ──
        // ReportBatchItemFailures enables partial batch reporting: only failed
        // messages are retried, not the entire batch. Requires the Lambda handler
        // to return SQSBatchResponse with failed message IDs.
        _ = new Aws.Lambda.EventSourceMapping(
            "sqs-to-lambda-mapping",
            new Aws.Lambda.EventSourceMappingArgs
            {
                EventSourceArn = msg.ProcessingQueue.Arn,
                FunctionName = pdfProcessorLambda.Arn,
                BatchSize = 10,
                Enabled = true,
                FunctionResponseTypes = { "ReportBatchItemFailures" },
            }
        );

        // ── IAM role for Appointment Reminder Lambda ──
        var reminderRole = new Aws.Iam.Role(
            "lambda-reminder-role",
            new Aws.Iam.RoleArgs
            {
                AssumeRolePolicy =
                    @"{
                    ""Version"": ""2012-10-17"",
                    ""Statement"": [{
                        ""Action"": ""sts:AssumeRole"",
                        ""Principal"": { ""Service"": ""lambda.amazonaws.com"" },
                        ""Effect"": ""Allow""
                    }]
                }",
                Tags = cfg.Tags,
            }
        );

        _ = new Aws.Iam.RolePolicyAttachment(
            "reminder-basic-execution",
            new Aws.Iam.RolePolicyAttachmentArgs
            {
                Role = reminderRole.Name,
                PolicyArn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            }
        );

        // Scoped SES send permission
        _ = new Aws.Iam.RolePolicy(
            "reminder-ses-send",
            new Aws.Iam.RolePolicyArgs
            {
                Role = reminderRole.Name,
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

        // ── Appointment Reminder Lambda (triggered directly by SNS) ──
        var reminderLambda = new Aws.Lambda.Function(
            "appointment-reminder",
            new Aws.Lambda.FunctionArgs
            {
                Name = $"telehealth-appointment-reminder-{cfg.StackName}",
                Role = reminderRole.Arn,
                Runtime = "dotnet10",
                Handler =
                    "AppointmentReminder-dev-SentReminder::AppointmentReminder_dev_SentReminder.Function::FunctionHandler",
                MemorySize = 256,
                Timeout = 60,
                Code = new FileArchive("./dummy-lambda"),
                Environment = new Aws.Lambda.Inputs.FunctionEnvironmentArgs
                {
                    Variables = new InputMap<string>
                    {
                        { "ENVIRONMENT", cfg.StackName },
                        { "SES_SENDER_EMAIL", "hongjx0321@gmail.com" },
                        { "SES_REGION", "us-east-1" },
                    },
                },
                Tags = cfg.Tags,
            },
            new CustomResourceOptions { IgnoreChanges = { "sourceCodeHash" } }
        );

        // Allow SNS to invoke the Lambda directly
        _ = new Aws.Lambda.Permission(
            "reminder-sns-invoke",
            new Aws.Lambda.PermissionArgs
            {
                Action = "lambda:InvokeFunction",
                Function = reminderLambda.Arn,
                Principal = "sns.amazonaws.com",
                SourceArn =
                    "arn:aws:sns:us-east-1:920263653571:TeleHealth_Contracts-AppointmentBookedEvent",
            }
        );

        // Subscribe Lambda directly to the AppointmentBookedEvent SNS topic
        _ = new Aws.Sns.TopicSubscription(
            "reminder-sns-sub",
            new Aws.Sns.TopicSubscriptionArgs
            {
                Topic =
                    "arn:aws:sns:us-east-1:920263653571:TeleHealth_Contracts-AppointmentBookedEvent",
                Protocol = "lambda",
                Endpoint = reminderLambda.Arn,
            }
        );

        return new Result
        {
            PdfProcessorLambda = pdfProcessorLambda,
            ReminderLambda = reminderLambda,
        };
    }
}
