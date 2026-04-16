using MassTransit;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Constants;
using TeleHealth.Api.Common.Exceptions.LabReports;
using TeleHealth.Api.Infrastructure.Persistence;
using TeleHealth.Contracts;

namespace TeleHealth.Api.Features.LabReports.Complete;

public class CompleteLabReportHandler(ApplicationDbContext db, IPublishEndpoint publishEndpoint)
{
    public async Task HandleAsync(string slug, CompleteLabReportCommand cmd, CancellationToken ct)
    {
        var report =
            await db
                .LabReports.Include(r => r.Patient)
                    .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(r => r.Slug == slug, ct)
            ?? throw new LabReportNotFoundException(slug);

        report.StatusId = StatusId.LabReport.Completed;
        report.Biomarkers = cmd.Biomarkers;
        report.UploadedAt = SystemClock.Instance.GetCurrentInstant();

        var completedEvent = new LabReportCompletedEvent(
            report.PublicId,
            report.Patient.PublicId,
            report.ReportType,
            SystemClock.Instance.GetCurrentInstant()
        );

        await publishEndpoint.Publish(completedEvent, ct);

        await db.SaveChangesAsync(ct);

        Log.Information("LabReport {Slug} marked as completed. MassTransit event queued.", slug);
    }
}
