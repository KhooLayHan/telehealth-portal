namespace TeleHealth.Infra;

using Pulumi;
using Aws = Pulumi.Aws;

/// <summary>
/// Secrets Manager and RDS PostgreSQL with security hardening:
///   - PubliclyAccessible = false (DB not on public internet)
///   - StorageEncrypted = true (encryption at rest, free)
///   - BackupRetentionPeriod = 7 (7-day automated backups)
///   - Security group: EB-only ingress
///   - CloudWatch log exports enabled
///   - Enhanced monitoring + Performance Insights
/// </summary>
public static class Database
{
    public sealed class Result
    {
        public required Aws.SecretsManager.Secret DbSecret { get; init; }
        public required Aws.Rds.Instance Instance { get; init; }
    }

    public static Result Create(
        StackConfig cfg,
        Networking.Result net)
    {
        // ── Secrets Manager — DB password stored as a managed secret ──
        var dbSecret = new Aws.SecretsManager.Secret(
            "telehealth-db-secret",
            new Aws.SecretsManager.SecretArgs
            {
                Name = $"telehealth/{cfg.StackName}/db-password",
                Description = $"RDS PostgreSQL password for TeleHealth {cfg.StackName} environment",
                RecoveryWindowInDays = 0, // Immediate deletion — set >=7 for production
                Tags = cfg.Tags,
            });

        _ = new Aws.SecretsManager.SecretVersion(
            "telehealth-db-secret-version",
            new Aws.SecretsManager.SecretVersionArgs
            {
                SecretId = dbSecret.Id,
                SecretString = cfg.DbPassword,
            });

        // ── RDS enhanced monitoring IAM role ──
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
            });

        _ = new Aws.Iam.RolePolicyAttachment(
            "rds-monitoring-policy",
            new Aws.Iam.RolePolicyAttachmentArgs
            {
                Role = rdsMonitoringRole.Name,
                PolicyArn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
            });

        // ── RDS PostgreSQL instance ──
        var database = new Aws.Rds.Instance(
            "telehealth-db",
            new Aws.Rds.InstanceArgs
            {
                Engine = "postgres",
                EngineVersion = "18.0",
                InstanceClass = cfg.DbInstanceClass,
                AllocatedStorage = 20,
                DbName = cfg.DbName,
                Username = cfg.DbUsername,
                Password = cfg.DbPassword,
                VpcSecurityGroupIds = { net.DbSecurityGroup.Id },
                DbSubnetGroupName = net.DbSubnetGroup.Name,

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

                Tags = cfg.Tags,
            },
            new CustomResourceOptions { Protect = true });

        return new Result
        {
            DbSecret = dbSecret,
            Instance = database,
        };
    }
}
