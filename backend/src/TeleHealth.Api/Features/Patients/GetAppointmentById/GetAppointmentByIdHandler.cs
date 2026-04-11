using Facet.Extensions;
using Microsoft.EntityFrameworkCore;
using Serilog;
using TeleHealth.Api.Common.Exceptions.Appointments;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Features.Patients.GetAllAppointments;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Patients.GetAppointmentById;

public sealed class GetAppointmentByIdHandler(ApplicationDbContext db)
{
    public async Task<AppointmentDto> HandleAsync(
        Guid userPublicId,
        string idOrSlug,
        CancellationToken ct
    )
    {
        var appointmentBySlug = await db
            .Appointments.AsNoTracking()
            .Where(a => a.Patient.User.PublicId == userPublicId && a.Slug == idOrSlug)
            .SelectFacet<Appointment, AppointmentDto>()
            .FirstOrDefaultAsync(ct);

        if (appointmentBySlug is not null)
        {
            Log.Information("Appointment found by slug. Slug: {Slug}", idOrSlug);
            return appointmentBySlug;
        }

        if (Guid.TryParse(idOrSlug, out var appointmentPublicId))
        {
            var appointmentById = await db
                .Appointments.AsNoTracking()
                .Where(a =>
                    a.Patient.User.PublicId == userPublicId && a.PublicId == appointmentPublicId
                )
                .SelectFacet<Appointment, AppointmentDto>()
                .FirstOrDefaultAsync(ct);

            if (appointmentById is not null)
            {
                Log.Information(
                    "Appointment found. AppointmentId: {@AppointmentId}",
                    appointmentPublicId
                );
                return appointmentById;
            }
        }

        Log.Warning("Appointment not found. AppointmentId: {AppointmentId}", appointmentPublicId);
        throw new AppointmentNotFoundException();
    }
}
