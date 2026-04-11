using Facet.Extensions;
using Microsoft.EntityFrameworkCore;
using Serilog;
using TeleHealth.Api.Common.Exceptions.Appointments;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Features.Patients.GetAllAppointments;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Patients.GetAppointmentByIdOrSlug;

public sealed class GetAppointmentByIdOrSlugHandler(ApplicationDbContext db)
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

        var parsedAsGuid = Guid.TryParse(idOrSlug, out var appointmentPublicId);
        if (parsedAsGuid)
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

        Log.Warning(
            "Appointment not found. LookupKey: {LookupKey}, AppointmentId: {AppointmentId}",
            idOrSlug,
            parsedAsGuid ? appointmentPublicId : (Guid?)null
        );
        throw new AppointmentNotFoundException();
    }
}
