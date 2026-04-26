using Amazon.S3;
using Amazon.S3.Model;

namespace TeleHealth.Api.Infrastructure.Aws;

public sealed class S3Service(IAmazonS3 s3Client, IConfiguration configuration) : IS3Service
{
    public string GeneratePreSignedUploadUrl(
        string objectKey,
        string contentType,
        int expiresMinutes = 15
    )
    {
        var bucketName =
            configuration["AWS_S3_LAB_REPORTS_BUCKET"]
            ?? configuration["Aws:S3:BucketName"]
            ?? throw new InvalidOperationException("S3 Bucket Name missing");

        var request = new GetPreSignedUrlRequest()
        {
            BucketName = bucketName,
            Key = objectKey,
            Verb = HttpVerb.PUT,
            ContentType = contentType,
            Expires = DateTime.UtcNow.AddMinutes(expiresMinutes),
        };

        return s3Client.GetPreSignedURL(request);
    }

    public string GeneratePreSignedDownloadUrl(string objectKey, int expireMinutes = 15)
    {
        var bucketName =
            configuration["AWS_S3_LAB_REPORTS_BUCKET"]
            ?? configuration["Aws:S3:BucketName"]
            ?? throw new InvalidOperationException("S3 Bucket Name missing");

        var request = new GetPreSignedUrlRequest
        {
            BucketName = bucketName,
            Key = objectKey,
            Verb = HttpVerb.GET,
            Expires = DateTime.UtcNow.AddMinutes(expireMinutes),
        };

        return s3Client.GetPreSignedURL(request);
    }

    public string GenerateProfileImageUploadUrl(
        string objectKey,
        string contentType,
        int expiresMinutes = 15
    )
    {
        var bucketName =
            configuration["AWS_S3_PROFILE_IMAGES_BUCKET"]
            ?? throw new InvalidOperationException("Profile Images S3 Bucket Name missing");

        var request = new GetPreSignedUrlRequest
        {
            BucketName = bucketName,
            Key = objectKey,
            Verb = HttpVerb.PUT,
            ContentType = contentType,
            Expires = DateTime.UtcNow.AddMinutes(expiresMinutes),
        };

        return s3Client.GetPreSignedURL(request);
    }

    public string GetProfileImagePublicUrl(string objectKey)
    {
        var bucketName =
            configuration["AWS_S3_PROFILE_IMAGES_BUCKET"]
            ?? throw new InvalidOperationException("Profile Images S3 Bucket Name missing");

        var region =
            configuration["Aws:Region"]
            ?? throw new InvalidOperationException("AWS Region missing");

        return $"https://{bucketName}.s3.{region}.amazonaws.com/{objectKey}";
    }
}
