using System.ComponentModel.DataAnnotations;

namespace TeleHealth.Api.Domain.Entities;

public sealed class Address
{
    public required string Street { get; set; }
    public required string City { get; set; }
    public required string State { get; set; }
    public required string PostalCode { get; set; }
    public required string Country { get; set; }
}
