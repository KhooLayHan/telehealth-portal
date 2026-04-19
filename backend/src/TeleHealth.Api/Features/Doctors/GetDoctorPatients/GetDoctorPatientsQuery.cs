namespace TeleHealth.Api.Features.Doctors.GetDoctorPatients;

public sealed record GetDoctorPatientsQuery(string? Search, int Page = 1, int PageSize = 20);