using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public class AddressConfiguration : IEntityTypeConfiguration<Address>
{
    public void Configure(EntityTypeBuilder<Address> builder)
    {
        builder.Property(a => a.Street).HasMaxLength(100).IsRequired();
        builder.Property(a => a.City).HasMaxLength(50).IsRequired();
        builder.Property(a => a.State).HasMaxLength(50).IsRequired();
        builder.Property(a => a.PostalCode).HasMaxLength(50).IsRequired();
        builder.Property(a => a.Country).HasMaxLength(50).IsRequired();
    }
}
