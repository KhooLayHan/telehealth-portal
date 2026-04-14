using NodaTime;

namespace TeleHealth.Api.Features.Doctor.GetSchedule;

public sealed record DoctorAppointmentDto
{
    public Guid PublicId { get; init; }
    public string Slug { get; init; } = string.Empty;
    public string PatientName { get; init; } = string.Empty;
    public string VisitReason { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string StatusColorCode { get; init; } = string.Empty;
    public LocalDate Date { get; init; }
    public LocalTime StartTime { get; init; }
    public LocalTime EndTime { get; init; }
}

public sealed record DoctorScheduleResponse
{
    public required List<DoctorAppointmentDto> Items { get; init; }
    public required int TotalCount { get; init; }
    public required int PendingCount { get; init; }
    public required LocalTime? NextAppointmentTime { get; init; }
    public required int Page { get; init; }
    public required int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}
