using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("roles");
        builder.HasKey(r => r.Id);
        builder.HasIndex(r => r.Slug).IsUnique();

        builder.HasData(
            new Role
            {
                Id = 1,
                Slug = "admin",
                Name = "Administrator",
                Description = "System administrator with full access",
                CreatedAt = DateTimeOffset.UtcNow,
            },
            new Role
            {
                Id = 2,
                Slug = "doctor",
                Name = "Doctor",
                Description = "Medical practitioner who can manage appointments and consultations",
                CreatedAt = DateTimeOffset.UtcNow,
            },
            new Role
            {
                Id = 3,
                Slug = "patient",
                Name = "Patient",
                Description = "Patient user who can book appointments and view medical records",
                CreatedAt = DateTimeOffset.UtcNow,
            },
            new Role
            {
                Id = 4,
                Slug = "receptionist",
                Name = "Receptionist",
                Description = "Front desk staff who manages appointments",
                CreatedAt = DateTimeOffset.UtcNow,
            },
            new Role
            {
                Id = 5,
                Slug = "lab-tech",
                Name = "Lab Technician",
                Description = "Laboratory staff who process and upload lab reports",
                CreatedAt = DateTimeOffset.UtcNow,
            }
        );
    }
}
