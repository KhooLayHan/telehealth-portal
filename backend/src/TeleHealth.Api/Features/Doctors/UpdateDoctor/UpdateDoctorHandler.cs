using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Exceptions.Doctors;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Doctors.UpdateDoctor;

public sealed class UpdateDoctorHandler(ApplicationDbContext db)
{
    public async Task HandleAsync(Guid doctorPublicId, UpdateDoctorCommand cmd, CancellationToken ct)
    {
        var doctor = await db
            .Doctors.Include(d => d.User)
            .Include(d => d.Department)
            .FirstOrDefaultAsync(d => d.PublicId == doctorPublicId, ct);

        if (doctor is null)
        {
            Log.Warning("Doctor not found. DoctorPublicId: {DoctorPublicId}", doctorPublicId);
            throw new DoctorNotFoundException(doctorPublicId.ToString());
        }

        // Resolve or create the department by name
        var department = await db.Departments.FirstOrDefaultAsync(
            dep => dep.Name == cmd.DepartmentName,
            ct
        );

        if (department is null)
        {
            department = new Department
            {
                Slug = cmd.DepartmentName.ToLowerInvariant().Replace(' ', '-'),
                Name = cmd.DepartmentName,
            };
            db.Departments.Add(department);
            await db.SaveChangesAsync(ct);
        }

        // Update User fields
        var user = doctor.User;
        user.FirstName = cmd.FirstName;
        user.LastName = cmd.LastName;
        user.Username = cmd.Username;
        user.Email = cmd.Email;
        user.Phone = cmd.PhoneNumber;
        user.Gender = cmd.Gender[0];
        user.DateOfBirth = cmd.DateOfBirth;
        user.UpdatedAt = SystemClock.Instance.GetCurrentInstant();

        user.Address = cmd.Address is { } addr
            ? new Address(addr.Street, addr.City, addr.State, addr.PostalCode, addr.Country)
            : null;

        // Update Doctor fields
        doctor.Specialization = cmd.Specialization;
        doctor.LicenseNumber = cmd.LicenseNumber;
        doctor.ConsultationFee = cmd.ConsultationFee;
        doctor.Bio = cmd.Bio;
        doctor.UpdatedAt = SystemClock.Instance.GetCurrentInstant();

        if (doctor.DepartmentId != department.Id)
            db.Entry(doctor).Property(nameof(Doctor.DepartmentId)).CurrentValue = department.Id;

        // Replace qualifications
        doctor.Qualifications = cmd.Qualifications
            .Select(q => new Qualification(q.Degree, q.Institution, q.Year))
            .ToList();

        await db.SaveChangesAsync(ct);

        Log.Information("Doctor updated. DoctorPublicId: {DoctorPublicId}", doctorPublicId);
    }
}
