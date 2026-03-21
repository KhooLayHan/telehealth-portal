using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(u => u.Id);

        builder.Property(u => u.PublicId).HasDefaultValueSql("gen_random_uuid()");

        builder.ToTable(
            "users",
            t =>
            {
                t.HasCheckConstraint("chk_users_gender", "gender IN ('M', 'F', 'O', 'N')");
                t.HasCheckConstraint("chk_users_dob_not_future", "date_of_birth <= CURRENT_DATE");
            }
        );

        builder.HasQueryFilter(u => u.DeletedAt == null);

        // builder.HasMany(u => u.Roles)
        //     .WithOne(r => r.Users)
        //     .UsingEntity(j => j.ToTable("user_roles"));
    }
}
