using NodaTime;

namespace TeleHealth.Api.Features.Doctors.GetDoctorPatients;

public sealed record DoctorPatientDto
{
    public Guid PatientPublicId { get; init; }
    public string FullName { get; init; } = string.Empty;
    public int Age { get; init; }
    public string Gender { get; init; } = string.Empty;
    public string? BloodGroup { get; init; }
    public string? Phone { get; init; }
    public List<AllergyDto> Allergies { get; init; } = [];
    public EmergencyContactDto? EmergencyContact { get; init; }
    public int TotalAppointments { get; init; }
    public LocalDate? LastVisitDate { get; init; }
}

public sealed record AllergyDto(string Allergen, string Severity, string Reaction);

public sealed record EmergencyContactDto(string Name, string Relationship, string Phone);

public sealed record GetDoctorPatientsResponse
{
    public List<DoctorPatientDto> Items { get; init; } = [];
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
}
