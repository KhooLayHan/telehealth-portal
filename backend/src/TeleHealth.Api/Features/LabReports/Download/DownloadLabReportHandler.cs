using Microsoft.EntityFrameworkCore;
using Serilog;
using TeleHealth.Api.Common.Exceptions.LabReports;
using TeleHealth.Api.Infrastructure.Aws;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.LabReports.Download;

public sealed class DownloadLabReportHandler(ApplicationDbContext db, IS3Service s3Service)
{
    public async Task<string> HandleAsync(
        string slug,
        Guid userPublicId,
        string userRole,
        CancellationToken ct
    )
    {
        var report = await db
            .LabReports.AsNoTracking()
            .Include(r => r.Patient)
                .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(r => r.Slug == slug, ct);

        if (report is null)
        {
            Log.Warning("Lab Report with slug '{Slug}' was not found.", slug);
            throw new LabReportNotFoundException();
        }

        if (userRole == "patient" && report.Patient.User.PublicId != userPublicId)
        {
            Log.Warning(
                "Patient '{UserPublicId}' is not authorized to download report '{Slug}'.",
                userPublicId,
                slug
            );
            throw new LabReportAccessDeniedException();
        }

        // 3. Ensure the PDF was actually uploaded
        if (string.IsNullOrWhiteSpace(report.S3ObjectKey))
        {
            Log.Warning("PDF Report with '{Slug}' uploading processed failed.", slug);
            throw new S3UploadFailedException();
        }

        return s3Service.GeneratePreSignedDownloadUrl(report.S3ObjectKey);
    }
}
