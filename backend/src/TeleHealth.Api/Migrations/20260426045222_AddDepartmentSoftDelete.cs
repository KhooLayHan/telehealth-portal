using Microsoft.EntityFrameworkCore.Migrations;
#nullable disable

namespace TeleHealth.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDepartmentSoftDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE departments ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // deleted_at is part of the canonical departments schema and may predate this migration.
        }
    }
}
