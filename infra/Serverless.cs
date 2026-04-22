// START OF FILE Serverless.cs
namespace TeleHealth.Infra;

using System.Collections.Generic;
using Pulumi;
using Aws = Pulumi.Aws;

public static class Serverless
{
    public sealed class Result
    {
        public required Aws.Lambda.Function PdfProcessorLambda { get; init; }
    }

    public static Result Create(StackConfig cfg, Messaging.Result msg, Storage.Result storage)
    {
        // 1. IAM Role for Lambda
        var lambdaRole = new Aws.Iam.Role(
            "lambda-pdf-processor-role",
            new Aws.Iam.RoleArgs
            {
                AssumeRolePolicy =
                    @"{
                ""Version"": ""2012-10-17"",
                ""Statement"":[{
                    ""Action"": ""sts:AssumeRole"",
                    ""Principal"": { ""Service"": ""lambda.amazonaws.com"" },
                    ""Effect"": ""Allow""
                }]
            }",
                Tags = cfg.Tags,
            }
        );

        // AWS Managed Policies for Lambda (Basic Execution & SQS Polling)
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

        // 2. The Lambda Function
        var pdfProcessorLambda = new Aws.Lambda.Function(
            "lab-pdf-processor",
            new Aws.Lambda.FunctionArgs
            {
                Name = $"telehealth-lab-pdf-processor-{cfg.StackName}",
                Role = lambdaRole.Arn,
                Runtime = "provided.al2023", // 🚀 Required for .NET 10 Native AOT!
                Handler = "bootstrap", // 🚀 Required for Native AOT!
                MemorySize = 256,
                Timeout = 30,

                // Provide a dummy deployment package so Pulumi can create the resource.
                // Our GitHub Actions CI/CD will overwrite this with the real code!
                Code = new FileArchive("./dummy-lambda.zip"),

                Environment = new Aws.Lambda.Inputs.FunctionEnvironmentArgs
                {
                    Variables = new InputMap<string> { { "ENVIRONMENT", cfg.StackName } },
                },
                Tags = cfg.Tags,
            }
        );

        // 3. The Event Source Mapping (Tells SQS to trigger this Lambda)
        _ = new Aws.Lambda.EventSourceMapping(
            "sqs-to-lambda-mapping",
            new Aws.Lambda.EventSourceMappingArgs
            {
                EventSourceArn = msg.ProcessingQueue.Arn,
                FunctionName = pdfProcessorLambda.Arn,
                BatchSize = 10,
                Enabled = true,
            }
        );

        return new Result { PdfProcessorLambda = pdfProcessorLambda };
    }
}
