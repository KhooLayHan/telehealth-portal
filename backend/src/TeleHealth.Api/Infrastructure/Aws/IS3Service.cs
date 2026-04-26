namespace TeleHealth.Api.Infrastructure.Aws;

public interface IS3Service
{
    string GeneratePreSignedUploadUrl(
        string objectKey,
        string contentType,
        int expiresMinutes = 15
    );

    string GeneratePreSignedDownloadUrl(string objectKey, int expireMinutes = 15);

    string GenerateProfileImageUploadUrl(
        string objectKey,
        string contentType,
        int expiresMinutes = 15
    );

    string GetProfileImagePublicUrl(string objectKey);
}
