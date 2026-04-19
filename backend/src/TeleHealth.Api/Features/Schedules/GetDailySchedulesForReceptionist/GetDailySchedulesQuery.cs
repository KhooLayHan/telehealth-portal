namespace TeleHealth.Api.Features.Schedules.GetDailySchedulesForReceptionist;

public sealed record GetDailySchedulesQuery(string Date, Guid? DoctorPublicId = null);
