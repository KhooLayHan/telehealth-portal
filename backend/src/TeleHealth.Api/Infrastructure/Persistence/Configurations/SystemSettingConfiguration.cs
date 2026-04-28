using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

// Configures the singleton system_settings table.
public sealed class SystemSettingConfiguration : IEntityTypeConfiguration<SystemSetting>
{
    public void Configure(EntityTypeBuilder<SystemSetting> builder)
    {
        builder.ToTable("system_settings");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Slug).HasMaxLength(50).IsRequired();
        builder.HasIndex(s => s.Slug).IsUnique();

        builder.Property(s => s.ClinicName).HasMaxLength(100).IsRequired();
        builder.Property(s => s.SupportEmail).HasMaxLength(255).IsRequired();
        builder.Property(s => s.DefaultAppointmentDurationMinutes).IsRequired();
        builder.Property(s => s.CreatedAt).IsRequired().HasDefaultValueSql("now()");
        builder.Property(s => s.UpdatedAt);

        builder
            .HasMany(s => s.OperatingHours)
            .WithOne(h => h.SystemSetting)
            .HasForeignKey(h => h.SystemSettingId)
            .HasConstraintName("fk_system_operating_hours_system_settings")
            .OnDelete(DeleteBehavior.Cascade);
    }
}
