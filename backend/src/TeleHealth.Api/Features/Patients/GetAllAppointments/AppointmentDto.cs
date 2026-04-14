using System.Linq.Expressions;
using Facet;
using Facet.Mapping;
using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Patients.GetAllAppointments;

public sealed record AppointmentDto(
    string DoctorName,
    string Specialization,
    string Status,
    string StatusColorCode,
    LocalDate Date,
    LocalTime StartTime,
    LocalTime EndTime,
    Guid PublicId,
    string Slug,
    string VisitReason
)
{
    public static Expression<Func<Appointment, AppointmentDto>> Projection =>
        a => new AppointmentDto(
            a.Doctor.User.FirstName + " " + a.Doctor.User.LastName,
            a.Doctor.Specialization,
            a.AppointmentStatus.Name,
            a.AppointmentStatus.ColorCode ?? "",
            a.DoctorSchedule.Date,
            a.DoctorSchedule.StartTime,
            a.DoctorSchedule.EndTime,
            a.PublicId,
            a.Slug,
            a.VisitReason
        );
}
