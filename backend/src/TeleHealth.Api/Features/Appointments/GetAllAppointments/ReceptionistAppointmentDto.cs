using Facet;
using Facet.Mapping;
using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Appointments.GetAllAppointments;

[Facet(
    typeof(Appointment),
    Include = ["PublicId", "Slug", "VisitReason"],
    Configuration = typeof(ReceptionistAppointmentMappingConfig)
)]
public partial record ReceptionistAppointmentDto
{
    public string PatientName { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string? DoctorAvatarUrl { get; set; }
    public string Specialization { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string StatusSlug { get; set; } = string.Empty;
    public string StatusColorCode { get; set; } = string.Empty;
    public string? PatientAvatarUrl { get; set; }
    public LocalDate Date { get; set; }
    public LocalTime StartTime { get; set; }
    public LocalTime EndTime { get; set; }
}

public class ReceptionistAppointmentMappingConfig
    : IFacetMapConfiguration<Appointment, ReceptionistAppointmentDto>
{
    public static void Map(Appointment source, ReceptionistAppointmentDto target)
    {
        target.PatientName = $"{source.Patient.User.FirstName} {source.Patient.User.LastName}";
        target.PatientAvatarUrl = source.Patient.User.AvatarUrl;
        target.DoctorName = $"{source.Doctor.User.FirstName} {source.Doctor.User.LastName}";
        target.DoctorAvatarUrl = source.Doctor.User.AvatarUrl;
        target.Specialization = source.Doctor.Specialization;
        target.Status = source.AppointmentStatus.Name;
        target.StatusSlug = source.AppointmentStatus.Slug;
        target.StatusColorCode = source.AppointmentStatus.ColorCode ?? string.Empty;
        target.Date = source.DoctorSchedule.Date;
        target.StartTime = source.DoctorSchedule.StartTime;
        target.EndTime = source.DoctorSchedule.EndTime;
    }
}
