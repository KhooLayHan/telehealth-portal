using Facet.Extensions;
using Microsoft.EntityFrameworkCore;

using Serilog;

using Slugify;

using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Aws;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.LabReports.Create;

public sealed class CreateLabReportHandler(ApplicationDbContext db, IS3Service service)
{
    public async Task<CreateLabReportResponse> HandleAsync(CreateLabReportCommand cmd, CancellationToken ct)
    {
        SlugHelper slugHelper = new();
        
        Log.Information("Generating S3 upload URL for Patient {PatientId}, Report: {ReportType}", cmd.PatientId, cmd.ReportType);
        
        var publicId = Guid.NewGuid();
        var slug = slugHelper.GenerateSlug($"lab-{cmd.ReportType}-{publicId.ToString()[..8]}");
        
        var s3ObjectKey = $"lab-reports/{DateTime.UtcNow:yyyy/MM}/patient-{cmd.PatientId}/{publicId}{Path.GetExtension(cmd.FileName)}";
        
        var labReport = new LabReport
        {
            PublicId = publicId,
            Slug = slug,
            PatientId = cmd.PatientId,
            ConsultationId = cmd.ConsultationId,
            StatusId = 1,
            ReportType = cmd.ReportType,
            FileName = cmd.FileName,
            S3ObjectKey = s3ObjectKey
        };

        db.LabReports.Add(labReport);
        await db.SaveChangesAsync(ct);
        
        var uploadUrl = service.GeneratePreSignedUploadUrl(s3ObjectKey, cmd.ContentType);

        Log.Information("Successfully initialized LabReport {PublicId}", publicId);
        return new CreateLabReportResponse(publicId, uploadUrl);
    }
}

public record CreateLabReportResponse(Guid PublicId, string UploadUrl);