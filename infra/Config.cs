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

    // JWT authentication
    public Output<string> JwtSecret { get; }

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

    /// <summary>
    /// Whether to skip the final DB snapshot on deletion.
    /// Defaults to true for "dev" stacks, false for all others (staging/prod
    /// always get a final snapshot unless explicitly overridden via config).
    /// Override with: pulumi config set telehealth:skipFinalSnapshot true
    /// </summary>
    public bool SkipFinalSnapshot { get; }

    public StackConfig()
    {
        var config = new Config("telehealth");
        DbPassword = config.RequireSecret("dbPassword");
        DbInstanceClass = config.Get("dbInstanceClass") ?? "db.t3.micro";
        DbName = config.Get("dbName") ?? "telehealth_dev";
        DbUsername = config.Get("dbUsername") ?? "telehealth_admin";
        JwtSecret = config.RequireSecret("jwtSecret");
        FrontendOrigin = config.Get("frontendOrigin") ?? "*";

        var awsConfig = new Config("aws");
        AwsRegion = awsConfig.Get("region") ?? "us-east-1";

        StackName = Deployment.Instance.StackName;

        // Dev stacks skip final snapshot by default; prod/staging do not
        var skipOverride = config.GetBoolean("skipFinalSnapshot");
        SkipFinalSnapshot =
            skipOverride ?? StackName.Equals("dev", StringComparison.OrdinalIgnoreCase);

        Tags = new InputMap<string>
        {
            { "Project", "TeleHealth-DDAC" },
            { "ManagedBy", "Pulumi" },
            { "Environment", StackName },
        };
    }
}
