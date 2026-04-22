using NodaTime;

namespace TeleHealth.Api.Features.Doctors.UpdateDoctor;

public sealed record UpdateDoctorCommand(
    string FirstName,
    string LastName,
    string Username,
    string Email,
    string? PhoneNumber,
    string Gender,
    LocalDate DateOfBirth,
    string? Bio,
    string Specialization,
    string LicenseNumber,
    decimal? ConsultationFee,
    string DepartmentName,
    UpdateDoctorAddressCommand? Address,
    List<UpdateDoctorQualificationCommand> Qualifications
);

public sealed record UpdateDoctorAddressCommand(
    string Street,
    string City,
    string State,
    string PostalCode,
    string Country
);

public sealed record UpdateDoctorQualificationCommand(string Degree, string Institution, int Year);
