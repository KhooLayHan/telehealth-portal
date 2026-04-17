using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeleHealth.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDoctorScheduleRowVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "row_version",
                table: "doctor_schedules",
                type: "bytea",
                rowVersion: true,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "row_version",
                table: "doctor_schedules");
        }
    }
}