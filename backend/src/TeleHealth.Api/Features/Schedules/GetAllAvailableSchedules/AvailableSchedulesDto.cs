using Facet;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Schedules.GetAllAvailableSchedules;

[Facet(typeof(DoctorSchedule), Include = ["PublicId", "Date", "StartTime", "EndTime"])]
public partial record AvailableScheduleDto;
