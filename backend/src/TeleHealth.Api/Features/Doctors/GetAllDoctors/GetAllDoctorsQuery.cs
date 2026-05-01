namespace TeleHealth.Api.Features.Doctors.GetAllDoctors;

// Query parameters for paginated doctor listing.
public sealed record GetAllDoctorsQuery(
    string? Search,
    string? Department,
    string? Specialization,
    int Page = 1,
    int PageSize = 50
);
