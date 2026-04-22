namespace TeleHealth.Infra;

using Pulumi;
using Aws = Pulumi.Aws;

/// <summary>
/// S3 buckets for the TeleHealth stack:
///   - Frontend static website (public, ForceDestroy for easy teardown)
///   - EB deployment artifacts (ephemeral)
///   - Lab reports (private, protected — contains patient medical data)
/// </summary>
public static class Storage
{
    public sealed class Result
    {
        public required Aws.S3.Bucket FrontendBucket { get; init; }
        public required Aws.S3.Bucket ArtifactsBucket { get; init; }
        public required Aws.S3.Bucket LabReportsBucket { get; init; }
    }

    public static Result Create(StackConfig cfg)
    {
        // ── Frontend — S3 static website for TanStack Router SPA ──
        var frontendBucket = new Aws.S3.Bucket(
            "telehealth-frontend",
            new Aws.S3.BucketArgs
            {
                Website = new Aws.S3.Inputs.BucketWebsiteArgs
                {
                    IndexDocument = "index.html",
                    ErrorDocument = "index.html", // Required for TanStack Router SPA
                },
                ForceDestroy = true,
                Tags = cfg.Tags,
            }
        );

        var frontendPublicAccessBlock = new Aws.S3.BucketPublicAccessBlock(
            "frontend-pab",
            new Aws.S3.BucketPublicAccessBlockArgs
            {
                Bucket = frontendBucket.Id,
                BlockPublicAcls = false,
                BlockPublicPolicy = false,
                IgnorePublicAcls = false,
                RestrictPublicBuckets = false,
            }
        );

        _ = new Aws.S3.BucketPolicy(
            "frontend-policy",
            new Aws.S3.BucketPolicyArgs
            {
                Bucket = frontendBucket.Id,
                Policy = frontendBucket.Arn.Apply(arn =>
                    $@"{{
                        ""Version"": ""2012-10-17"",
                        ""Statement"": [{{
                            ""Effect"": ""Allow"",
                            ""Principal"": ""*"",
                            ""Action"": [""s3:GetObject""],
                            ""Resource"": [""{arn}/*""]
                        }}]
                    }}"
                ),
            },
            new CustomResourceOptions { DependsOn = frontendPublicAccessBlock }
        );

        // ── EB deployment artifacts (Dockerrun.aws.json) ──
        var artifactsBucket = new Aws.S3.Bucket(
            "telehealth-eb-artifacts",
            new Aws.S3.BucketArgs { ForceDestroy = true, Tags = cfg.Tags }
        );

        // ── Lab reports — private, protected, patient medical data ──
        var labReportsBucket = new Aws.S3.Bucket(
            "telehealth-lab-reports",
            new Aws.S3.BucketArgs { Tags = cfg.Tags },
            new CustomResourceOptions { Protect = true }
        );

        _ = new Aws.S3.BucketCorsConfiguration(
            "labReportsCors",
            new Aws.S3.BucketCorsConfigurationArgs
            {
                Bucket = labReportsBucket.Id,
                CorsRules = new[]
                {
                    new Aws.S3.Inputs.BucketCorsConfigurationCorsRuleArgs
                    {
                        AllowedHeaders = { "*" },
                        AllowedMethods = { "PUT", "POST", "GET" },
                        AllowedOrigins = { cfg.FrontendOrigin },
                        MaxAgeSeconds = 3000,
                    },
                },
            }
        );

        // Block ALL public access — lab reports contain sensitive patient data
        _ = new Aws.S3.BucketPublicAccessBlock(
            "lab-reports-pab",
            new Aws.S3.BucketPublicAccessBlockArgs
            {
                Bucket = labReportsBucket.Id,
                BlockPublicAcls = true,
                BlockPublicPolicy = true,
                IgnorePublicAcls = true,
                RestrictPublicBuckets = true,
            }
        );

        return new Result
        {
            FrontendBucket = frontendBucket,
            ArtifactsBucket = artifactsBucket,
            LabReportsBucket = labReportsBucket,
        };
    }
}
