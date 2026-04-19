namespace TeleHealth.Api.Features.Schedules.GetAllAvailableSchedules;

public sealed record GetAvailableSchedulesQuery(string Date, Guid? DoctorPublicId = null);