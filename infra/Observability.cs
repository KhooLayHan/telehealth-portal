namespace TeleHealth.Infra;

using Pulumi;
using Aws = Pulumi.Aws;

/// <summary>
/// CloudWatch log groups and X-Ray tracing configuration.
/// </summary>
public static class Observability
{
    public sealed class Result
    {
        public required Aws.CloudWatch.LogGroup ApiLogGroup { get; init; }
        public required Aws.Xray.Group XrayGroup { get; init; }
    }

    public static Result Create(StackConfig cfg)
    {
        // ── CloudWatch log groups ──
        var apiLogGroup = new Aws.CloudWatch.LogGroup(
            "telehealth-api-logs",
            new Aws.CloudWatch.LogGroupArgs
            {
                Name = $"/telehealth/{cfg.StackName}/api",
                RetentionInDays = 30,
                Tags = cfg.Tags,
            }
        );

        // ── X-Ray — tracing group + sampling rule ──
        _ = new Aws.Xray.SamplingRule(
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
                Tags = cfg.Tags,
            },
            new CustomResourceOptions { ImportId = "telehealth-api-sampling" }
        );

        var xrayGroup = new Aws.Xray.Group(
            "telehealth-xray-group",
            new Aws.Xray.GroupArgs
            {
                GroupName = $"telehealth-api-{cfg.StackName}",
                FilterExpression = "service(\"telehealth-api\")",
                InsightsConfiguration = new Aws.Xray.Inputs.GroupInsightsConfigurationArgs
                {
                    InsightsEnabled = true,
                    NotificationsEnabled = false,
                },
                Tags = cfg.Tags,
            },
            new CustomResourceOptions { Id = "telehealth-api" }
        );

        return new Result { ApiLogGroup = apiLogGroup, XrayGroup = xrayGroup };
    }
}
