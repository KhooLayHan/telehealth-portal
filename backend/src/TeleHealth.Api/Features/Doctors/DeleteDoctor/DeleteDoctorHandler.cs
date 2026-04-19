using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Exceptions.Doctors;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Doctors.DeleteDoctor;

public sealed class DeleteDoctorHandler(ApplicationDbContext db)
{
    public async Task HandleAsync(Guid doctorPublicId, CancellationToken ct)
    {
        var doctor = await db
            .Doctors.Include(d => d.User)
            .FirstOrDefaultAsync(d => d.PublicId == doctorPublicId, ct);

        if (doctor is null)
        {
            Log.Warning("Doctor not found. DoctorPublicId: {DoctorPublicId}", doctorPublicId);
            throw new DoctorNotFoundException(doctorPublicId.ToString());
        }

        var now = SystemClock.Instance.GetCurrentInstant();

        doctor.DeletedAt = now;
        doctor.User.DeletedAt = now;

        await db.SaveChangesAsync(ct);

        Log.Information("Doctor soft-deleted. DoctorPublicId: {DoctorPublicId}", doctorPublicId);
    }
}
