using Facet;
using Facet.Mapping;
using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Patients.GetAllAppointments;

[Facet(
    typeof(Appointment),
    Include = ["PublicId", "Slug", "VisitReason"],
    Configuration = typeof(AppointmentMappingConfig)
)]
public partial record AppointmentDto
{
    public string DoctorName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string StatusColorCode { get; set; } = string.Empty;
    public LocalDate Date { get; set; }
    public LocalTime StartTime { get; set; }
    public LocalTime EndTime { get; set; }
}

public class AppointmentMappingConfig : IFacetMapConfiguration<Appointment, AppointmentDto>
{
    public static void Map(Appointment source, AppointmentDto target)
    {
        target.DoctorName = $"{source.Doctor.User.FirstName} {source.Doctor.User.LastName}";
        target.Specialization = source.Doctor.Specialization;
        target.Status = source.AppointmentStatus.Name;
        target.StatusColorCode = source.AppointmentStatus.ColorCode ?? String.Empty;
        target.Date = source.DoctorSchedule.Date;
        target.StartTime = source.DoctorSchedule.StartTime;
        target.EndTime = source.DoctorSchedule.EndTime;
    }
}
