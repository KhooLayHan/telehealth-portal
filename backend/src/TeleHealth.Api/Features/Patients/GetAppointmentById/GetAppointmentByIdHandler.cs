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
        Guid appointmentPublicId,
        CancellationToken ct
    )
    {
        var appointment = await db
            .Appointments.AsNoTracking()
            .Where(a =>
                a.Patient.User.PublicId == userPublicId && a.PublicId == appointmentPublicId
            )
            .SelectFacet<Appointment, AppointmentDto>()
            .FirstOrDefaultAsync(ct);

        if (appointment is null)
        {
            Log.Warning(
                "Appointment not found. AppointmentId: {AppointmentId}",
                appointmentPublicId
            );
            throw new AppointmentNotFoundException();
        }

        Log.Information("Appointment found. AppointmentId: {@AppointmentId}", appointmentPublicId);
        return appointment;
    }
}
