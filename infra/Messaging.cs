namespace TeleHealth.Infra;

using Pulumi;
using Aws = Pulumi.Aws;

/// <summary>
/// SNS topic and SQS queue for the lab-report processing pipeline.
/// SNS fans out medical alerts; SQS buffers reports for async processing.
/// </summary>
public static class Messaging
{
    public sealed class Result
    {
        public required Aws.Sns.Topic MedicalAlertsTopic { get; init; }
        public required Aws.Sqs.Queue ProcessingQueue { get; init; }
    }

    public static Result Create(StackConfig cfg)
    {
        var medicalAlertsTopic = new Aws.Sns.Topic(
            "medical-alerts-topic",
            new Aws.Sns.TopicArgs { Tags = cfg.Tags });

        var processingQueue = new Aws.Sqs.Queue(
            "report-processing-queue",
            new Aws.Sqs.QueueArgs { Tags = cfg.Tags });

        _ = new Aws.Sns.TopicSubscription(
            "queue-topic-sub",
            new Aws.Sns.TopicSubscriptionArgs
            {
                Topic = medicalAlertsTopic.Arn,
                Protocol = "sqs",
                Endpoint = processingQueue.Arn,
            });

        // Allow SNS to send messages to the SQS queue
        _ = new Aws.Sqs.QueuePolicy(
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
            });

        return new Result
        {
            MedicalAlertsTopic = medicalAlertsTopic,
            ProcessingQueue = processingQueue,
        };
    }
}
