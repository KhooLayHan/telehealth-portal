namespace TeleHealth.Api.Features.Admins.GetDashboardSummary;

// Response DTO for the aggregate counts displayed on the admin dashboard.
public sealed record AdminDashboardSummaryDto(
    int TodayAppointments,
    int Patients,
    int Doctors,
    int Staff
);
