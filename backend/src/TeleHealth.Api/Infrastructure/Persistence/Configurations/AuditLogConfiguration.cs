using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Npgsql.EntityFrameworkCore.PostgreSQL.ValueGeneration;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        var actionColumn = builder.Metadata.FindProperty(nameof(AuditLog.Action))!.GetColumnName();
        var userIdColumn = builder
            .Metadata.FindProperty(nameof(AuditLog.PerformedByUserId))!
            .GetColumnName();
        var systemIdColumn = builder
            .Metadata.FindProperty(nameof(AuditLog.PerformedBySystem))!
            .GetColumnName();

        builder.ToTable(
            "audit_logs",
            t =>
            {
                t.HasCheckConstraint(
                    "chk_audit_action",
                    $"{actionColumn} in ('INSERT', 'UPDATE', 'DELETE')"
                );
                t.HasCheckConstraint(
                    "chk_audit_logs_actor",
                    $"{systemIdColumn} or {userIdColumn} is not null"
                );
            }
        );

        builder.HasKey(a => a.Id);

        builder.Property(a => a.PublicId).HasValueGenerator<NpgsqlSequentialGuidValueGenerator>();

        builder.Property(a => a.TableName).HasMaxLength(100).IsRequired();

        builder.Property(a => a.RecordId).IsRequired();

        builder.Property(a => a.Action).HasMaxLength(20).IsRequired();

        builder.Property(a => a.OldValues);

        builder.Property(a => a.NewValues);

        builder.Property(a => a.ChangedColumns).HasColumnType("text[]");

        builder.Property(a => a.Metadata);

        builder.Property(a => a.PerformedByUserId);

        builder.Property(a => a.PerformedBySystem);

        builder.Property(a => a.CreatedAt).IsRequired().HasDefaultValueSql("now()");

        builder
            .HasOne(a => a.User)
            .WithMany(u => u.AuditLogs)
            .HasForeignKey(a => a.PerformedByUserId)
            .IsRequired(false);
    }
}
