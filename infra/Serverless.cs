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
    }

    public static Result Create(
        StackConfig cfg,
        Messaging.Result msg,
        Storage.Result storage)
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
            });

        // Managed policies: basic execution (CloudWatch Logs) + SQS polling
        _ = new Aws.Iam.RolePolicyAttachment(
            "lambda-basic-execution",
            new Aws.Iam.RolePolicyAttachmentArgs
            {
                Role = lambdaRole.Name,
                PolicyArn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            });

        _ = new Aws.Iam.RolePolicyAttachment(
            "lambda-sqs-execution",
            new Aws.Iam.RolePolicyAttachmentArgs
            {
                Role = lambdaRole.Name,
                PolicyArn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole",
            });

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
            });

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
            });

        // ── SQS event source mapping (triggers Lambda from the processing queue) ──
        _ = new Aws.Lambda.EventSourceMapping(
            "sqs-to-lambda-mapping",
            new Aws.Lambda.EventSourceMappingArgs
            {
                EventSourceArn = msg.ProcessingQueue.Arn,
                FunctionName = pdfProcessorLambda.Arn,
                BatchSize = 10,
                Enabled = true,
            });

        return new Result { PdfProcessorLambda = pdfProcessorLambda };
    }
}
