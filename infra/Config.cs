namespace TeleHealth.Infra;

using Pulumi;

/// <summary>
/// Centralized configuration for the TeleHealth infrastructure stack.
/// All config keys, defaults, and shared tags are defined here so that
/// domain files never read Config directly.
/// </summary>
public sealed class StackConfig
{
    // AWS
    public string AwsRegion { get; }

    /// <summary>
    /// Allowed CORS origin for the lab reports S3 bucket.
    /// Defaults to "*" (any origin) for dev convenience.
    /// Set per-stack: pulumi config set telehealth:frontendOrigin https://telehealth.example.com
    /// </summary>
    public string FrontendOrigin { get; }

    // Stack metadata
    public string StackName { get; }
    public InputMap<string> Tags { get; }

    public StackConfig()
    {
        var config = new Config("telehealth");
        FrontendOrigin = config.Get("frontendOrigin") ?? "*";

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
