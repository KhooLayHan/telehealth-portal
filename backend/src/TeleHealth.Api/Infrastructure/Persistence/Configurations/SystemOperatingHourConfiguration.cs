using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

// Configures weekly operating hours for the clinic settings record.
public sealed class SystemOperatingHourConfiguration : IEntityTypeConfiguration<SystemOperatingHour>
{
    public void Configure(EntityTypeBuilder<SystemOperatingHour> builder)
    {
        builder.ToTable("system_operating_hours");

        builder.HasKey(h => h.Id);

        builder.Property(h => h.SystemSettingId).HasColumnName("system_settings_id").IsRequired();
        builder.Property(h => h.DayOfWeek).IsRequired();
        builder.Property(h => h.IsOpen).IsRequired().HasDefaultValue(true);
        builder.Property(h => h.OpenTime);
        builder.Property(h => h.CloseTime);
        builder.Property(h => h.CreatedAt).IsRequired().HasDefaultValueSql("now()");
        builder.Property(h => h.UpdatedAt);
    }
}
