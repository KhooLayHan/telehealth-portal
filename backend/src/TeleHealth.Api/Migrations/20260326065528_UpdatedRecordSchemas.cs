using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeleHealth.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedRecordSchemas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_appointments_appointment_status_status_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments_doctor_doctor_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments_doctor_schedule_schedule_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments_patient_patient_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_doctor_schedules_schedule_status_status_id",
                table: "doctor_schedules");

            migrationBuilder.DropForeignKey(
                name: "fk_lab_reports_lab_report_status_status_id",
                table: "lab_reports");

            migrationBuilder.DropForeignKey(
                name: "fk_lab_reports_patient_patient_id",
                table: "lab_reports");

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_appointment_statuses_status_id",
                table: "appointments",
                column: "status_id",
                principalTable: "appointment_statuses",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_doctor_schedules_schedule_id",
                table: "appointments",
                column: "schedule_id",
                principalTable: "doctor_schedules",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_doctors_doctor_id",
                table: "appointments",
                column: "doctor_id",
                principalTable: "doctors",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_patients_patient_id",
                table: "appointments",
                column: "patient_id",
                principalTable: "patients",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_doctor_schedules_schedule_statuses_status_id",
                table: "doctor_schedules",
                column: "status_id",
                principalTable: "schedule_statuses",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_lab_reports_lab_report_statuses_status_id",
                table: "lab_reports",
                column: "status_id",
                principalTable: "lab_report_statuses",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_lab_reports_patients_patient_id",
                table: "lab_reports",
                column: "patient_id",
                principalTable: "patients",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_appointments_appointment_statuses_status_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments_doctor_schedules_schedule_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments_doctors_doctor_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments_patients_patient_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_doctor_schedules_schedule_statuses_status_id",
                table: "doctor_schedules");

            migrationBuilder.DropForeignKey(
                name: "fk_lab_reports_lab_report_statuses_status_id",
                table: "lab_reports");

            migrationBuilder.DropForeignKey(
                name: "fk_lab_reports_patients_patient_id",
                table: "lab_reports");

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_appointment_status_status_id",
                table: "appointments",
                column: "status_id",
                principalTable: "appointment_statuses",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_doctor_doctor_id",
                table: "appointments",
                column: "doctor_id",
                principalTable: "doctors",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_doctor_schedule_schedule_id",
                table: "appointments",
                column: "schedule_id",
                principalTable: "doctor_schedules",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_patient_patient_id",
                table: "appointments",
                column: "patient_id",
                principalTable: "patients",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_doctor_schedules_schedule_status_status_id",
                table: "doctor_schedules",
                column: "status_id",
                principalTable: "schedule_statuses",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_lab_reports_lab_report_status_status_id",
                table: "lab_reports",
                column: "status_id",
                principalTable: "lab_report_statuses",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_lab_reports_patient_patient_id",
                table: "lab_reports",
                column: "patient_id",
                principalTable: "patients",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
