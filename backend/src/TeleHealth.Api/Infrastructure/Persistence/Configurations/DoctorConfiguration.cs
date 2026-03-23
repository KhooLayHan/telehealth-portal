using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Npgsql.EntityFrameworkCore.PostgreSQL.ValueGeneration;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public class DoctorConfiguration : IEntityTypeConfiguration<Doctor>
{
    public void Configure(EntityTypeBuilder<Doctor> builder)
    {
        var consultationFee = builder
            .Metadata.FindProperty(nameof(Doctor.ConsultationFee))!
            .GetColumnName();
        var deletedAtColumn = builder
            .Metadata.FindProperty(nameof(Doctor.DeletedAt))!
            .GetColumnName();

        builder.ToTable(
            "doctors",
            t =>
                t.HasCheckConstraint(
                    "chk_doctors_fee_nonnegative",
                    $"{consultationFee} is null or {consultationFee} >= 0"
                )
        );

        builder.HasKey(d => d.Id);

        builder.Property(d => d.PublicId).HasValueGenerator<NpgsqlSequentialGuidValueGenerator>();

        builder.Property(d => d.Slug).HasMaxLength(100).IsRequired();
        builder.HasIndex(d => d.Slug).IsUnique();

        builder.Property(d => d.UserId).IsRequired();
        builder
            .HasIndex(d => d.UserId)
            .IsUnique()
            .HasFilter($"{deletedAtColumn} is null")
            .HasDatabaseName("uq_doctors_user_active");

        builder.Property(d => d.DepartmentId).IsRequired();

        builder.Property(d => d.LicenseNumber).HasMaxLength(50).IsRequired();
        builder
            .HasIndex(d => d.LicenseNumber)
            .IsUnique()
            .HasFilter($"{deletedAtColumn} is null")
            .HasDatabaseName("uq_doctors_license_active");

        builder.Property(d => d.Specialization).HasMaxLength(255).IsRequired();

        builder.Property(d => d.ConsultationFee).HasColumnType("numeric(10, 2)");

        builder.ComplexCollection(
            d => d.Qualifications,
            c =>
            {
                c.Property(q => q.Degree).IsRequired();
                c.Property(q => q.Institution).IsRequired();
                c.Property(q => q.Year).IsRequired();
                c.ToJson();
            }
        );

        builder.Property(d => d.Bio).HasColumnType("text");

        builder.Property(d => d.CreatedAt).IsRequired().HasDefaultValueSql("now()");

        builder.Property(d => d.UpdatedAt);

        builder.Property(d => d.DeletedAt);
        builder.HasQueryFilter(d => d.DeletedAt == null);

        builder
            .HasOne(d => d.User)
            .WithOne(u => u.Doctor)
            .HasForeignKey<Doctor>(d => d.UserId)
            .IsRequired();

        builder
            .HasOne(dc => dc.Department)
            .WithMany(dp => dp.Doctors)
            .HasForeignKey(dc => dc.DepartmentId)
            .IsRequired();
    }
}
