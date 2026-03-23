namespace TeleHealth.Api.Domain.Entities;

public sealed class Qualification
{
    public required string Degree { get; set; }
    public required string Institution { get; set; }
    public required int Year { get; set; }
}