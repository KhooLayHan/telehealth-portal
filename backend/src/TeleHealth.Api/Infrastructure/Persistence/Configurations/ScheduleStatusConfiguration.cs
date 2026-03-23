using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public sealed class ScheduleStatusConfiguration : IEntityTypeConfiguration<ScheduleStatus>
{
    public void Configure(EntityTypeBuilder<ScheduleStatus> builder)
    {
        builder.ToTable("schedule_statuses");

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
                Slug = "available",
                Name = "Available",
                ColorCode = "#10B981",
                Description = "Slot is open for booking",
            },
            new ScheduleStatus
            {
                Id = 2,
                Slug = "booked",
                Name = "Booked",
                ColorCode = "#3B82F6",
                Description = "Slot has been reserved by a patient",
            },
            new ScheduleStatus
            {
                Id = 3,
                Slug = "blocked",
                Name = "Blocked",
                ColorCode = "#EF4444",
                Description = "Slot is blocked by doctor or admin",
            }
        );
    }
}
