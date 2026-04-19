using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.LabReports.Complete;

public sealed record CompleteLabReportCommand(List<Biomarker> Biomarkers);