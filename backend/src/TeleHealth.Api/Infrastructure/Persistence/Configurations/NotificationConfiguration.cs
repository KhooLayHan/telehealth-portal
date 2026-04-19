using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using Npgsql.EntityFrameworkCore.PostgreSQL.ValueGeneration;

using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        var statusColumn = builder
            .Metadata.FindProperty(nameof(Notification.Status))!
            .GetColumnName();

        builder.ToTable(
            "notifications",
            t =>
                t.HasCheckConstraint(
                    "chk_notification_status",
                    $"{statusColumn} in ('queued', 'sent', 'failed')"
                )
        );

        builder.HasKey(n => n.Id);

        builder.Property(n => n.PublicId).HasValueGenerator<NpgsqlSequentialGuidValueGenerator>();

        builder.Property(n => n.RecipientUserId).IsRequired();

        builder.Property(n => n.Type).HasMaxLength(50).IsRequired();

        builder.Property(n => n.Channel).HasMaxLength(20).IsRequired();

        builder.Property(n => n.Subject).HasMaxLength(255);

        builder.Property(n => n.Body).HasColumnType("text").IsRequired();

        builder.Property(n => n.RelatedEntityType).HasMaxLength(50);

        builder.Property(n => n.RelatedEntityId);

        builder.Property(n => n.SnsMessageId).HasMaxLength(100);

        builder.Property(n => n.Status).HasMaxLength(20).IsRequired();

        builder.Property(n => n.SendAt);

        builder.Property(n => n.ErrorMessage).HasColumnType("text");

        builder.Property(n => n.CreatedAt).IsRequired().HasDefaultValueSql("now()");

        builder.Property(n => n.UpdatedAt);

        builder
            .HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.RecipientUserId)
            .IsRequired(false);
    }
}