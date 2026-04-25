namespace TeleHealth.Api.Features.LabReports.GetAllLabReports;

public sealed record GetAllLabReportsQuery(
    string? Search,
    string? Status,
    int Page = 1,
    int PageSize = 10,
    string? SortOrder = "asc",
    Guid? PatientPublicId = null
);
