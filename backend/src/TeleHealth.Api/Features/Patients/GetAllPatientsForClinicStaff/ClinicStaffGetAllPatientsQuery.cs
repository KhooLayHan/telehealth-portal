namespace TeleHealth.Api.Features.Patients.GetAllPatientsForClinicStaff;

public sealed record ClinicStaffGetAllPatientsQuery(
    string? Search,
    string? Gender,
    int Page = 1,
    int PageSize = 10,
    string? SortOrder = "asc"
);
