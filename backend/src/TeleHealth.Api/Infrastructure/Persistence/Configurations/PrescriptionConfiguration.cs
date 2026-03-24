using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Npgsql.EntityFrameworkCore.PostgreSQL.ValueGeneration;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public class PrescriptionConfiguration : IEntityTypeConfiguration<Prescription>
{
    public void Configure(EntityTypeBuilder<Prescription> builder)
    {
        var durationDaysColumn = builder
            .Metadata.FindProperty(nameof(Prescription.DurationDays))!
            .GetColumnName();

        builder.ToTable(
            "prescriptions",
            t =>
            {
                t.HasCheckConstraint(
                    "chk_prescriptions_duration_positive",
                    $"{durationDaysColumn} > 0"
                );
            }
        );

        builder.HasKey(p => p.Id);

        builder.Property(p => p.PublicId).HasValueGenerator<NpgsqlSequentialGuidValueGenerator>();

        builder.Property(p => p.ConsultationId).IsRequired();

        builder.Property(p => p.MedicationName).HasMaxLength(255).IsRequired();

        builder.Property(p => p.Dosage).HasMaxLength(100).IsRequired();

        builder.Property(p => p.Frequency).HasMaxLength(100).IsRequired();

        builder.Property(p => p.Dosage).HasColumnType("smallint").IsRequired();

        builder.ComplexProperty(
            p => p.Instructions,
            c =>
            {
                c.Property(i => i.TakeWith).IsRequired();
                c.Property(i => i.Warnings).IsRequired();
                c.Property(i => i.Storage).IsRequired();
                c.Property(i => i.MissedDose).IsRequired();
                c.ToJson();
            }
        );

        builder.Property(p => p.CreatedAt).IsRequired().HasDefaultValueSql("now()");

        builder.Property(p => p.UpdatedAt);

        builder.Property(p => p.DeletedAt);
        builder.HasQueryFilter("SoftDeletionFilter", p => p.DeletedAt == null);

        builder
            .HasOne(c => c.Consultation)
            .WithMany(c => c.Prescriptions)
            .HasForeignKey(p => p.ConsultationId)
            .IsRequired();
    }
}
