using NodaTime;

namespace TeleHealth.Api.Features.Doctors.GetAllDoctors;

public sealed record DoctorListDto
{
    public Guid DoctorPublicId { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Specialization { get; init; } = string.Empty;
    public string DepartmentName { get; init; } = string.Empty;
    public string LicenseNumber { get; init; } = string.Empty;
    public decimal? ConsultationFee { get; init; }
    public string? PhoneNumber { get; init; }
    public string Slug { get; init; } = string.Empty;
    public string Gender { get; init; } = string.Empty;
    public LocalDate DateOfBirth { get; init; }
    public string? AvatarUrl { get; init; }
    public AddressDoctorDto? Address { get; init; }
    public List<QualificationDoctorDto> Qualifications { get; init; } = [];
    public string? Bio { get; init; }
    public Instant CreatedAt { get; init; }
}

public sealed record QualificationDoctorDto(string Degree, string Institution, int Year);

public sealed record AddressDoctorDto(
    string Street,
    string City,
    string State,
    string PostalCode,
    string Country
);
