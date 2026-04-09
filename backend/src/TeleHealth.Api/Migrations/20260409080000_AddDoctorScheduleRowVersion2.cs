using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeleHealth.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDoctorScheduleRowVersion2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "row_version",
                table: "doctor_schedules",
                newName: "xmin");

            migrationBuilder.AlterColumn<uint>(
                name: "xmin",
                table: "doctor_schedules",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u,
                oldClrType: typeof(byte[]),
                oldType: "bytea",
                oldRowVersion: true,
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "xmin",
                table: "doctor_schedules",
                newName: "row_version");

            migrationBuilder.AlterColumn<byte[]>(
                name: "row_version",
                table: "doctor_schedules",
                type: "bytea",
                rowVersion: true,
                nullable: true,
                oldClrType: typeof(uint),
                oldType: "xid",
                oldRowVersion: true);
        }
    }
}
