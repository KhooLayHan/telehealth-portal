using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

public sealed class Doctor
{
    public long Id { get; init; }
    public Guid PublicId { get; init; }
    public required string Slug { get; init; }
    public required long UserId { get; set; }
    public required int DepartmentId { get; init; }
    public required string LicenseNumber { get; set; }
    public required string Specialization { get; set; }
    public decimal? ConsultationFee { get; set; }
    public List<Qualification>? Qualifications { get; set; }
    public string? Bio { get; set; }
    public Instant CreatedAt { get; set; }
    public Instant? UpdatedAt { get; set; }
    public Instant? DeletedAt { get; set; }
    public User User { get; } = null!;
    public Department Department { get; } = null!;
    public ICollection<DoctorSchedule> DoctorSchedules { get; } = [];
    public ICollection<Appointment> Appointments { get; } = [];
}