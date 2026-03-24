using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Npgsql.EntityFrameworkCore.PostgreSQL.ValueGeneration;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public class LabReportConfiguration : IEntityTypeConfiguration<LabReport>
{
    public void Configure(EntityTypeBuilder<LabReport> builder)
    {
        builder.ToTable("lab_reports");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.PublicId).HasValueGenerator<NpgsqlSequentialGuidValueGenerator>();

        builder.Property(l => l.Slug).HasMaxLength(100).IsRequired();
        builder.HasIndex(l => l.Slug).IsUnique();
        
        builder.Property(l => l.ConsultationId);

        builder.Property(l => l.PatientId).IsRequired();
        
        builder.Property(l => l.StatusId).IsRequired();
        
        builder.Property(l => l.ReportType).HasMaxLength(100).IsRequired();
        
        builder.Property(l => l.S3ObjectKey).HasMaxLength(500);
        
        builder.Property(l => l.FileName).HasMaxLength(255);
        
        builder.Property(l => l.FileSizeBytes);
        
        builder.ComplexCollection(
            l => l.Biomarkers,
            c =>
            {
                c.Property(b => b.Name).IsRequired();
                c.Property(b => b.Value).IsRequired();
                c.Property(b => b.Unit).IsRequired();
                c.Property(b => b.ReferenceRange).IsRequired();
                c.Property(b => b.Flag).IsRequired();
                c.ToJson();
            }
        );

        builder.Property(l => l.UploadedAt);
        
        builder.Property(l => l.CreatedAt).IsRequired().HasDefaultValueSql("now()");

        builder.Property(l => l.UpdatedAt);

        builder.Property(l => l.DeletedAt);
        builder.HasQueryFilter("SoftDeletionFilter", l => l.DeletedAt == null);

        builder
            .HasOne(l => l.Consultation)
            .WithMany(c => c.LabReports)
            .HasForeignKey(l => l.ConsultationId)
            .IsRequired(false);
        
        builder
            .HasOne(l => l.Patient)
            .WithMany(p => p.LabReports)
            .HasForeignKey(l => l.PatientId)
            .IsRequired();
        
        builder
            .HasOne(l => l.LabReportStatus)
            .WithMany(s => s.LabReports)
            .HasForeignKey(l => l.StatusId)
            .IsRequired();
    }
}
