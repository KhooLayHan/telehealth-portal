namespace TeleHealth.Api.Features.Patients.GetAllPatientsForClinicStaff;

public sealed record ClinicStaffGetAllPatientsQuery(
    string? Search,
    int Page = 1,
    int PageSize = 10,
    string? SortOrder = "asc"
);
