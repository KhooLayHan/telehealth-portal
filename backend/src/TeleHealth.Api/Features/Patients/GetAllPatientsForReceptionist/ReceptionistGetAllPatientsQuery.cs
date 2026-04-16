namespace TeleHealth.Api.Features.Patients.GetAllPatientsForReceptionist;

public sealed record ReceptionistGetAllPatientsQuery(
    string? Search,
    int Page = 1,
    int PageSize = 10,
    string? SortOrder = "asc"
);
