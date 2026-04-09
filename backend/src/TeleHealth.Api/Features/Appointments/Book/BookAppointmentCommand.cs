using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Appointments.Book;

public sealed record BookAppointmentCommand(
    Guid SchedulePublicId,
    string VisitReason,
    List<Symptom>? Symptoms
);
