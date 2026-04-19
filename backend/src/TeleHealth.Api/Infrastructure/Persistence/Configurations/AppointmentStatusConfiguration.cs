using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public sealed class AppointmentStatusConfiguration : IEntityTypeConfiguration<AppointmentStatus>
{
    public void Configure(EntityTypeBuilder<AppointmentStatus> builder)
    {
        builder.ToTable("appointment_statuses");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Slug).HasMaxLength(50).IsRequired();
        builder.HasIndex(s => s.Slug).IsUnique();

        builder.Property(s => s.Name).HasMaxLength(100).IsRequired();

        builder.Property(s => s.ColorCode).HasMaxLength(7);

        builder.Property(s => s.IsTerminal).IsRequired().HasDefaultValue(false);

        builder.Property(s => s.Description).HasMaxLength(255);

        builder.Property(s => s.CreatedAt).IsRequired().HasDefaultValueSql("now()");

        builder.HasData(
            new AppointmentStatus
            {
                Id = 1,
                Slug = "booked",
                Name = "Booked",
                ColorCode = "#3B82F6",
                IsTerminal = false,
                Description = "Appointment confirmed and scheduled",
            },
            new AppointmentStatus
            {
                Id = 2,
                Slug = "checked-in",
                Name = "Checked In",
                ColorCode = "#10B981",
                IsTerminal = false,
                Description = "Patient has arrived at clinic",
            },
            new AppointmentStatus
            {
                Id = 3,
                Slug = "in-progress",
                Name = "In Progress",
                ColorCode = "#F59E0B",
                IsTerminal = false,
                Description = "Consultation is currently ongoing",
            },
            new AppointmentStatus
            {
                Id = 4,
                Slug = "completed",
                Name = "Completed",
                ColorCode = "#059669",
                IsTerminal = true,
                Description = "Appointment finished successfully",
            },
            new AppointmentStatus
            {
                Id = 5,
                Slug = "cancelled",
                Name = "Cancelled",
                ColorCode = "#EF4444",
                IsTerminal = true,
                Description = "Appointment was cancelled",
            },
            new AppointmentStatus
            {
                Id = 6,
                Slug = "no-show",
                Name = "No Show",
                ColorCode = "#6B7280",
                IsTerminal = true,
                Description = "Patient did not attend the appointment",
            }
        );
    }
}