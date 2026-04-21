using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Patients.GetAllPatientsForClinicStaff;

public sealed record ClinicStaffPatientDto
{
    public Guid PatientPublicId { get; init; }
    public string Slug { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public LocalDate DateOfBirth { get; init; }
    public int Age => Period.Between(DateOfBirth, LocalDate.FromDateTime(DateTime.Now)).Years;
    public string PhoneNumber { get; init; } = string.Empty;
    public string BloodGroup { get; init; } = string.Empty;
    public string? Gender { get; init; }
    public List<Allergy>? Allergies { get; init; }
    public List<EmergencyContact>? EmergencyContacts { get; init; }
}
