namespace TeleHealth.Api.Features.LabReports.GetAllPatients;

public sealed record LabTechGetAllPatientsQuery(
    string? Search,
    int Page = 1,
    int PageSize = 10,
    string? SortOrder = "asc"
);
