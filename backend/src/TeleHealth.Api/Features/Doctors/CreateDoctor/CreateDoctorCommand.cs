using Destructurama.Attributed;
using NodaTime;

namespace TeleHealth.Api.Features.Doctors.CreateDoctor;

public sealed record CreateDoctorCommand(
    string FirstName,
    string LastName,
    string Username,
    string Email,
    [property: NotLogged] string Password,
    string? PhoneNumber,
    string Gender,
    LocalDate DateOfBirth,
    [property: NotLogged] string IcNumber,
    string? Bio,
    string Specialization,
    string LicenseNumber,
    decimal? ConsultationFee,
    string DepartmentName,
    CreateDoctorAddressCommand? Address,
    List<CreateDoctorQualificationCommand> Qualifications
);

public sealed record CreateDoctorAddressCommand(
    string Street,
    string City,
    string State,
    string PostalCode,
    string Country
);

public sealed record CreateDoctorQualificationCommand(string Degree, string Institution, int Year);
