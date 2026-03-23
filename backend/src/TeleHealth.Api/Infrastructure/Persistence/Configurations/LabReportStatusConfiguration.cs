using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public sealed class LabReportStatusConfiguration : IEntityTypeConfiguration<LabReportStatus>
{
    public void Configure(EntityTypeBuilder<LabReportStatus> builder)
    {
        builder.ToTable("lab_report_statuses");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Slug).HasMaxLength(50).IsRequired();
        builder.HasIndex(s => s.Slug).IsUnique();

        builder.Property(s => s.Name).HasMaxLength(100).IsRequired();

        builder.Property(s => s.ColorCode).HasMaxLength(7);

        builder.Property(s => s.Description).HasMaxLength(255);

        builder.Property(s => s.CreatedAt).IsRequired().HasDefaultValueSql("now()");

        builder.HasData(
            new ScheduleStatus
            {
                Id = 1,
                Slug = "pending",
                Name = "Pending Upload",
                ColorCode = "#6B7280",
                Description = "Waiting for lab technician to upload PDF",
            },
            new ScheduleStatus
            {
                Id = 2,
                Slug = "processing",
                Name = "Processing",
                ColorCode = "#F59E0B",
                Description = "Lambda function is extracting biomarkers",
            },
            new ScheduleStatus
            {
                Id = 3,
                Slug = "completed",
                Name = "Completed",
                ColorCode = "#10B981",
                Description = "Lab report successfully processed and ready",
            },
            new ScheduleStatus
            {
                Id = 4,
                Slug = "rejected",
                Name = "Rejected",
                ColorCode = "#EF4444",
                Description = "Failed to process or invalid lab report file",
            }
        );
    }
}
