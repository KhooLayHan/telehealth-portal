using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NodaTime;
using NodaTime.Extensions;
using Npgsql.EntityFrameworkCore.PostgreSQL.ValueGeneration;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public sealed class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Slug).HasMaxLength(50).IsRequired();
        builder.HasIndex(r => r.Slug).IsUnique();

        builder.Property(r => r.Name).HasMaxLength(100).IsRequired();

        builder.Property(r => r.Description).HasMaxLength(255);

        builder.Property(r => r.CreatedAt).IsRequired().HasDefaultValueSql("NOW()");

        builder.HasData(
            new Role
            {
                Id = 1,
                Slug = "admin",
                Name = "Administrator",
                Description = "System administrator with full access",
            },
            new Role
            {
                Id = 2,
                Slug = "doctor",
                Name = "Doctor",
                Description = "Medical practitioner who can manage appointments and consultations",
            },
            new Role
            {
                Id = 3,
                Slug = "patient",
                Name = "Patient",
                Description = "Patient user who can book appointments and view medical records",
            },
            new Role
            {
                Id = 4,
                Slug = "receptionist",
                Name = "Receptionist",
                Description = "Front desk staff who manages appointments",
            },
            new Role
            {
                Id = 5,
                Slug = "lab-tech",
                Name = "Lab Technician",
                Description = "Laboratory staff who process and upload lab reports",
            }
        );
    }
}
