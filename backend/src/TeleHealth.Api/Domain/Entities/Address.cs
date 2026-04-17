using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TeleHealth.Api.Domain.Entities;

public sealed record class Address(
    string Street,
    string City,
    string State,
    string PostalCode,
    string Country
)
{ }