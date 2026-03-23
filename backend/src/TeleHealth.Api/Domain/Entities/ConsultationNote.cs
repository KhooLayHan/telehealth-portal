namespace TeleHealth.Api.Domain.Entities;

public sealed record ConsultationNote(
    string Subjective,
    string Objective,
    string Assessment,
    string Plan
) { }
