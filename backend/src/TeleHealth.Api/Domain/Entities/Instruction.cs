namespace TeleHealth.Api.Domain.Entities;

public sealed record Instruction(
    string TakeWith,
    List<string> Warnings,
    string Storage,
    string MissedDose
) { }
