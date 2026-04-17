namespace TeleHealth.Api.Features.Doctors.GetSchedule;

public sealed record GetDoctorScheduleQuery(
    DateOnly? Date,
    string? Status,
    string? Search,
    int Page = 1,
    int PageSize = 20,
    string? SortOrder = "asc"
);