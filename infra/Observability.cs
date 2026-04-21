namespace TeleHealth.Infra;

using Pulumi;
using Aws = Pulumi.Aws;

/// <summary>
/// CloudWatch log groups, metric alarms, and X-Ray tracing configuration.
/// Alarms route to the medical alerts SNS topic for unified notification.
/// </summary>
public static class Observability
{
    public sealed class Result
    {
        public required Aws.CloudWatch.LogGroup ApiLogGroup { get; init; }
        public required Aws.Xray.Group XrayGroup { get; init; }
    }

    public static Result Create(
        StackConfig cfg,
        Database.Result db,
        Messaging.Result msg)
    {
        // ── CloudWatch log groups ──
        var apiLogGroup = new Aws.CloudWatch.LogGroup(
            "telehealth-api-logs",
            new Aws.CloudWatch.LogGroupArgs
            {
                Name = $"/telehealth/{cfg.StackName}/api",
                RetentionInDays = 30,
                Tags = cfg.Tags,
            });

        // NOTE: RDS log groups (/aws/rds/instance/{id}/postgresql, /aws/rds/instance/{id}/upgrade)
        // are auto-created by AWS when EnabledCloudwatchLogsExports is set on the RDS instance.
        // Do not create them here — it would conflict with the AWS-managed groups.

        // ── Metric alarms — route to SNS ──

        // RDS CPU > 80% for 10 minutes
        _ = new Aws.CloudWatch.MetricAlarm(
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
                Dimensions = new InputMap<string>
                {
                    { "DBInstanceIdentifier", db.Instance.Id },
                },
                AlarmActions = { msg.MedicalAlertsTopic.Arn },
                OkActions = { msg.MedicalAlertsTopic.Arn },
                Tags = cfg.Tags,
            });

        // RDS free storage < 2 GiB
        _ = new Aws.CloudWatch.MetricAlarm(
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
                Dimensions = new InputMap<string>
                {
                    { "DBInstanceIdentifier", db.Instance.Id },
                },
                AlarmActions = { msg.MedicalAlertsTopic.Arn },
                OkActions = { msg.MedicalAlertsTopic.Arn },
                Tags = cfg.Tags,
            });

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
            });

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
                Tags = cfg.Tags,
            });

        return new Result
        {
            ApiLogGroup = apiLogGroup,
            XrayGroup = xrayGroup,
        };
    }
}
