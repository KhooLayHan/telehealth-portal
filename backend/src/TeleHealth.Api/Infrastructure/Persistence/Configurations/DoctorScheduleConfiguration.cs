using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Npgsql.EntityFrameworkCore.PostgreSQL.ValueGeneration;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public class DoctorScheduleConfiguration : IEntityTypeConfiguration<DoctorSchedule>
{
    public void Configure(EntityTypeBuilder<DoctorSchedule> builder)
    {
        var endTimeColumn = builder
            .Metadata.FindProperty(nameof(DoctorSchedule.EndTime))!
            .GetColumnName();
        var startTimeColumn = builder
            .Metadata.FindProperty(nameof(DoctorSchedule.StartTime))!
            .GetColumnName();

        builder.ToTable(
            "doctor_schedules",
            t =>
                t.HasCheckConstraint(
                    "chk_schedules_time_range",
                    $"{endTimeColumn} > {startTimeColumn}"
                )
        );

        builder.HasKey(d => d.Id);

        builder.Property(d => d.PublicId).HasValueGenerator<NpgsqlSequentialGuidValueGenerator>();

        builder.Property(d => d.DoctorId).IsRequired();

        builder.Property(d => d.StatusId).IsRequired();

        builder.Property(d => d.DoctorId).IsRequired();

        builder.Property(d => d.DoctorId).IsRequired();

        builder.Property(d => d.StartTime).IsRequired();

        builder.Property(d => d.EndTime).IsRequired();

        builder.Property(d => d.CreatedAt).IsRequired().HasDefaultValueSql("now()");

        builder.Property(d => d.UpdatedAt);

        builder.Property(d => d.DeletedAt);
        builder.HasQueryFilter("SoftDeletionFilter", d => d.DeletedAt == null);

        builder
            .HasOne(ds => ds.Doctor)
            .WithMany(d => d.DoctorSchedules)
            .HasForeignKey(ds => ds.DoctorId)
            .IsRequired();

        builder
            .HasOne(d => d.ScheduleStatus)
            .WithMany(s => s.DoctorSchedules)
            .HasForeignKey(d => d.StatusId)
            .IsRequired();
    }
}
