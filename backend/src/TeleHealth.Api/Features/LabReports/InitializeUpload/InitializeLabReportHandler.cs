using Microsoft.EntityFrameworkCore;
using Serilog;
using Slugify;
using TeleHealth.Api.Common.Constants;
using TeleHealth.Api.Common.Exceptions.Patients;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Aws;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.LabReports.InitializeUpload;

public sealed record InitializeLabReportResponse(Guid PublicId, string UploadUrl);

public sealed class InitializeLabReportHandler(ApplicationDbContext db, IS3Service s3Service)
{
    public async Task<InitializeLabReportResponse> HandleAsync(
        InitializeLabReportCommand cmd,
        CancellationToken ct
    )
    {
        SlugHelper slugHelper = new();

        var patient = await db
            .Patients.AsNoTracking()
            .FirstOrDefaultAsync(p => p.PublicId == cmd.PatientPublicId, ct);

        if (patient is null)
        {
            Log.Warning("Patient with ID {PatientPublicId} was not found.", cmd.PatientPublicId);
            throw new PatientNotFoundException();
        }

        var publicId = Guid.NewGuid();
        var slug = slugHelper.GenerateSlug($"lab-{cmd.ReportType}-{publicId.ToString()[..8]}");

        // Construct a clean S3 Object Key: lab-reports/2026/04/patient-uuid/report-uuid.pdf
        var s3ObjectKey =
            $"lab-reports/{DateTime.UtcNow:yyyy/MM}/patient-{patient.PublicId}/{publicId}{Path.GetExtension(cmd.FileName)}";

        var labReport = new LabReport
        {
            PublicId = publicId,
            Slug = slug,
            PatientId = patient.Id,
            StatusId = StatusId.LabReport.Pending,
            ReportType = cmd.ReportType,
            FileName = cmd.FileName,
            S3ObjectKey = s3ObjectKey,
        };

        var uploadUrl = s3Service.GeneratePreSignedUploadUrl(s3ObjectKey, cmd.ContentType);

        db.LabReports.Add(labReport);
        await db.SaveChangesAsync(ct);

        Log.Information("Generated S3 Upload URL for LabReport {PublicId}", publicId);

        return new InitializeLabReportResponse(publicId, uploadUrl);
    }
}
