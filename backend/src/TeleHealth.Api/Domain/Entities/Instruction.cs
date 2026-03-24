namespace TeleHealth.Api.Domain.Entities;

public sealed class Instruction
{
    public required string TakeWith { get; set; }
    public required List<string> Warnings { get; set; }
    public required string Storage { get; set; }
    public required string MissedDose { get; set; }
}
