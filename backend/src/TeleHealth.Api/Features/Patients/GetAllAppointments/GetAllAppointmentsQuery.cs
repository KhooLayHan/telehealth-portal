namespace TeleHealth.Api.Features.Patients.GetAllAppointments;

public sealed record GetAllAppointmentsQuery(
    string? View,
    string? Status,
    string? Search,
    Guid? DoctorId,
    string? From,
    string? To,
    int Page = 1,
    int PageSize = 10,
    string? SortOrder = "asc"
);
