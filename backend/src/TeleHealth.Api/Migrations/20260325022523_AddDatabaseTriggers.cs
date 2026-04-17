using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeleHealth.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDatabaseTriggers : Migration
    {
        readonly string[] _updateTables =
        [
            "users",
            "doctors",
            "patients",
            "doctor_schedules",
            "appointments",
            "consultations",
            "prescriptions",
            "lab_reports",
            "notifications",
        ];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
                CREATE OR REPLACE FUNCTION fn_set_updated_at()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = NOW();
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            "
            );

            foreach (var table in _updateTables)
            {
                migrationBuilder.Sql(
                    $@"
                    CREATE TRIGGER trg_{table}_updated_at
                    BEFORE UPDATE ON {table}
                    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
                "
                );
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach (var table in _updateTables)
            {
                migrationBuilder.Sql($"DROP TRIGGER IF EXISTS trg_{table}_updated_at ON {table};");
            }

            migrationBuilder.Sql("DROP FUNCTION IF EXISTS fn_set_updated_at();");
        }
    }
}