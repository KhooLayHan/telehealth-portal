namespace TeleHealth.Infra;

using Pulumi;

/// <summary>
/// Centralized configuration for the TeleHealth infrastructure stack.
/// All config keys, defaults, and shared tags are defined here so that
/// domain files never read Config directly.
/// </summary>
public sealed class StackConfig
{
    // Database
    public Output<string> DbPassword { get; }
    public string DbInstanceClass { get; }
    public string DbName { get; }
    public string DbUsername { get; }

    // AWS
    public string AwsRegion { get; }

    // Stack metadata
    public string StackName { get; }
    public InputMap<string> Tags { get; }

    public StackConfig()
    {
        var config = new Config("telehealth");
        DbPassword = config.RequireSecret("dbPassword");
        DbInstanceClass = config.Get("dbInstanceClass") ?? "db.t3.micro";
        DbName = config.Get("dbName") ?? "telehealth_dev";
        DbUsername = config.Get("dbUsername") ?? "telehealth_admin";

        var awsConfig = new Config("aws");
        AwsRegion = awsConfig.Get("region") ?? "us-east-1";

        StackName = Deployment.Instance.StackName;

        Tags = new InputMap<string>
        {
            { "Project", "TeleHealth-DDAC" },
            { "ManagedBy", "Pulumi" },
            { "Environment", StackName },
        };
    }
}
