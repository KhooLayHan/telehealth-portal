using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using Npgsql.EntityFrameworkCore.PostgreSQL.ValueGeneration;

using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public class PatientConfiguration : IEntityTypeConfiguration<Patient>
{
    public void Configure(EntityTypeBuilder<Patient> builder)
    {
        var deletedAtColumn = builder
            .Metadata.FindProperty(nameof(Patient.DeletedAt))!
            .GetColumnName();

        builder.ToTable("patients");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.PublicId).HasValueGenerator<NpgsqlSequentialGuidValueGenerator>();

        builder.Property(p => p.Slug).HasMaxLength(100).IsRequired();
        builder.HasIndex(p => p.Slug).IsUnique();

        builder.Property(p => p.UserId).IsRequired();
        builder
            .HasIndex(p => p.UserId)
            .IsUnique()
            .HasFilter($"{deletedAtColumn} is null")
            .HasDatabaseName("uq_patients_user_active");

        builder.Property(p => p.BloodGroup).HasMaxLength(3);

        builder.ComplexCollection(
            p => p.Allergies,
            c =>
            {
                c.Property(a => a.Allergen).IsRequired();
                c.Property(a => a.Severity).IsRequired();
                c.Property(a => a.Reaction).IsRequired();
                c.ToJson();
            }
        );

        builder.ComplexProperty(
            p => p.EmergencyContact,
            c =>
            {
                c.Property(e => e.Name).HasMaxLength(100).IsRequired();
                c.Property(e => e.Relationship).HasMaxLength(100).IsRequired();
                c.Property(e => e.Phone).HasMaxLength(16).IsRequired();
                c.ToJson();
            }
        );

        builder.Property(p => p.CreatedAt).IsRequired().HasDefaultValueSql("now()");

        builder.Property(p => p.UpdatedAt);

        builder.Property(p => p.DeletedAt);
        builder.HasQueryFilter("SoftDeletionFilter", p => p.DeletedAt == null);

        builder
            .HasOne(p => p.User)
            .WithOne(u => u.Patient)
            .HasForeignKey<Patient>(p => p.UserId)
            .IsRequired();
    }
}