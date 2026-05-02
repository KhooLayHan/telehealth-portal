using Microsoft.EntityFrameworkCore;
using NodaTime;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Admins.GetDashboardSummary;

// Queries aggregate dashboard counts for admin users.
public sealed class AdminGetDashboardSummaryHandler(ApplicationDbContext db)
{
    private const string LabTechSlug = "lab-tech";
    private const string ReceptionistSlug = "receptionist";

    public async Task<AdminDashboardSummaryDto> HandleAsync(CancellationToken ct)
    {
        var today = SystemClock.Instance.GetCurrentInstant().InUtc().Date;

        var todayAppointments = await db.Appointments.CountAsync(
            appointment => appointment.DoctorSchedule.Date == today,
            ct
        );
        var patients = await db.Patients.CountAsync(ct);
        var doctors = await db.Doctors.CountAsync(ct);
        var staff = await db.Users.CountAsync(
            user =>
                user.Roles.Any(role => role.Slug == ReceptionistSlug || role.Slug == LabTechSlug),
            ct
        );

        return new AdminDashboardSummaryDto(todayAppointments, patients, doctors, staff);
    }
}
