using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

public sealed class Doctor
{
    public int Id { get; init; }
    public Guid PublicId { get; init; }
    public required string Slug { get; init; }
    public required int UserId { get; init; }
    public required int DepartmentId { get; init; }
    public required string LicenseNumber { get; set; }
    public required string Specialization { get; set; }
    public decimal? ConsultationFee { get; set; }

    public Instant CreatedAt { get; set; }

    public Department Department { get; set; } = null!;

    public ICollection<Doctor> Users { get; } = [];
}
