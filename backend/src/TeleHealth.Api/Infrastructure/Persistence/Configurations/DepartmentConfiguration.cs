using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public sealed class DepartmentConfiguration : IEntityTypeConfiguration<Department>
{
    public void Configure(EntityTypeBuilder<Department> builder)
    {
        builder.ToTable("departments");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Slug).HasMaxLength(50).IsRequired();
        builder.HasIndex(d => d.Slug).IsUnique();

        builder.Property(d => d.Name).HasMaxLength(100).IsRequired();

        builder.Property(d => d.Description).HasMaxLength(500);

        builder.Property(d => d.CreatedAt).IsRequired().HasDefaultValueSql("now()");

        builder.HasData(
            new Department
            {
                Id = 1,
                Slug = "general",
                Name = "General Practice",
                Description = "Primary care and general health services",
            },
            new Department
            {
                Id = 2,
                Slug = "cardiology",
                Name = "Cardiology",
                Description = "Heart and cardiovascular health",
            },
            new Department
            {
                Id = 3,
                Slug = "pediatrics",
                Name = "Pediatrics",
                Description = "Children and adolescent healthcare",
            },
            new Department
            {
                Id = 4,
                Slug = "orthopedics",
                Name = "Orthopedics",
                Description = "Bone, joint, and muscle conditions",
            },
            new Department
            {
                Id = 5,
                Slug = "dermatology",
                Name = "Dermatology",
                Description = "Skin conditions and treatments",
            },
            new Department
            {
                Id = 6,
                Slug = "neurology",
                Name = "Neurology",
                Description = "Brain and nervous system disorders",
            }
        );
    }
}
