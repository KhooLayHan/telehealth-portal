using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NodaTime;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TeleHealth.Api.Migrations
{
    /// <inheritdoc />
    public partial class LookupAndIdentityProfileTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_users_slug",
                table: "users");

            migrationBuilder.DropCheckConstraint(
                name: "CHK_Users_Dob_NotFuture",
                table: "users");

            migrationBuilder.DropCheckConstraint(
                name: "CHK_Users_Gender",
                table: "users");

            migrationBuilder.AlterColumn<Instant>(
                name: "created_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(Instant),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "NOW()");

            migrationBuilder.AlterColumn<string>(
                name: "avatar_url",
                table: "users",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AlterColumn<Instant>(
                name: "created_at",
                table: "user_roles",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(Instant),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "NOW()");

            migrationBuilder.AlterColumn<Instant>(
                name: "created_at",
                table: "roles",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()",
                oldClrType: typeof(Instant),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "NOW()");

            migrationBuilder.CreateTable(
                name: "appointment_statuses",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    slug = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    color_code = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    is_terminal = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    created_at = table.Column<Instant>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_appointment_statuses", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "departments",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    slug = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<Instant>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_departments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "lab_report_statuses",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    slug = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    color_code = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    created_at = table.Column<Instant>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_lab_report_statuses", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "patients",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    public_id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    blood_group = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true),
                    created_at = table.Column<Instant>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<Instant>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<Instant>(type: "timestamp with time zone", nullable: true),
                    allergies = table.Column<string>(type: "jsonb", nullable: true),
                    emergency_contact = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_patients", x => x.id);
                    table.ForeignKey(
                        name: "fk_patients_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "schedule_statuses",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    slug = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    color_code = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    created_at = table.Column<Instant>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_schedule_statuses", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "doctors",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    public_id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    department_id = table.Column<int>(type: "integer", nullable: false),
                    license_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    specialization = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    consultation_fee = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    bio = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<Instant>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    updated_at = table.Column<Instant>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<Instant>(type: "timestamp with time zone", nullable: true),
                    qualifications = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_doctors", x => x.id);
                    table.CheckConstraint("chk_doctors_fee_nonnegative", "consultation_fee is null or consultation_fee >= 0");
                    table.ForeignKey(
                        name: "fk_doctors_departments_department_id",
                        column: x => x.department_id,
                        principalTable: "departments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_doctors_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "appointment_statuses",
                columns: new[] { "id", "color_code", "description", "name", "slug" },
                values: new object[,]
                {
                    { 1, "#3B82F6", "Appointment confirmed and scheduled", "Booked", "booked" },
                    { 2, "#10B981", "Patient has arrived at clinic", "Checked In", "checked-in" },
                    { 3, "#F59E0B", "Consultation is currently ongoing", "In Progress", "in-progress" }
                });

            migrationBuilder.InsertData(
                table: "appointment_statuses",
                columns: new[] { "id", "color_code", "description", "is_terminal", "name", "slug" },
                values: new object[,]
                {
                    { 4, "#059669", "Appointment finished successfully", true, "Completed", "completed" },
                    { 5, "#EF4444", "Appointment was cancelled", true, "Cancelled", "cancelled" },
                    { 6, "#6B7280", "Patient did not attend the appointment", true, "No Show", "no-show" }
                });

            migrationBuilder.InsertData(
                table: "departments",
                columns: new[] { "id", "description", "name", "slug" },
                values: new object[,]
                {
                    { 1, "Primary care and general health services", "General Practice", "general" },
                    { 2, "Heart and cardiovascular health", "Cardiology", "cardiology" },
                    { 3, "Children and adolescent healthcare", "Pediatrics", "pediatrics" },
                    { 4, "Bone, joint, and muscle conditions", "Orthopedics", "orthopedics" },
                    { 5, "Skin conditions and treatments", "Dermatology", "dermatology" },
                    { 6, "Brain and nervous system disorders", "Neurology", "neurology" }
                });

            migrationBuilder.InsertData(
                table: "lab_report_statuses",
                columns: new[] { "id", "color_code", "description", "name", "slug" },
                values: new object[,]
                {
                    { 1, "#6B7280", "Waiting for lab technician to upload PDF", "Pending Upload", "pending" },
                    { 2, "#F59E0B", "Lambda function is extracting biomarkers", "Processing", "processing" },
                    { 3, "#10B981", "Lab report successfully processed and ready", "Completed", "completed" },
                    { 4, "#EF4444", "Failed to process or invalid lab report file", "Rejected", "rejected" }
                });

            migrationBuilder.InsertData(
                table: "schedule_statuses",
                columns: new[] { "id", "color_code", "description", "name", "slug" },
                values: new object[,]
                {
                    { 1, "#10B981", "Slot is open for booking", "Available", "available" },
                    { 2, "#3B82F6", "Slot has been reserved by a patient", "Booked", "booked" },
                    { 3, "#EF4444", "Slot is blocked by doctor or admin", "Blocked", "blocked" }
                });

            migrationBuilder.CreateIndex(
                name: "uq_users_email_active",
                table: "users",
                column: "email",
                unique: true,
                filter: "deleted_at is null");

            migrationBuilder.CreateIndex(
                name: "uq_users_ic_active",
                table: "users",
                column: "ic_number",
                unique: true,
                filter: "deleted_at is null");

            migrationBuilder.CreateIndex(
                name: "uq_users_slug_active",
                table: "users",
                column: "slug",
                unique: true,
                filter: "deleted_at is null");

            migrationBuilder.CreateIndex(
                name: "uq_users_username_active",
                table: "users",
                column: "username",
                unique: true,
                filter: "deleted_at is null");

            migrationBuilder.AddCheckConstraint(
                name: "chk_users_dob_not_future",
                table: "users",
                sql: "date_of_birth <= current_date");

            migrationBuilder.AddCheckConstraint(
                name: "chk_users_gender",
                table: "users",
                sql: "gender in ('M', 'F', 'O', 'N')");

            migrationBuilder.CreateIndex(
                name: "ix_appointment_statuses_slug",
                table: "appointment_statuses",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_departments_slug",
                table: "departments",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_doctors_department_id",
                table: "doctors",
                column: "department_id");

            migrationBuilder.CreateIndex(
                name: "ix_doctors_slug",
                table: "doctors",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_doctors_license_active",
                table: "doctors",
                column: "license_number",
                unique: true,
                filter: "deleted_at is null");

            migrationBuilder.CreateIndex(
                name: "uq_doctors_user_active",
                table: "doctors",
                column: "user_id",
                unique: true,
                filter: "deleted_at is null");

            migrationBuilder.CreateIndex(
                name: "ix_lab_report_statuses_slug",
                table: "lab_report_statuses",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_patients_slug",
                table: "patients",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_patients_user_active",
                table: "patients",
                column: "user_id",
                unique: true,
                filter: "deleted_at is null");

            migrationBuilder.CreateIndex(
                name: "ix_schedule_statuses_slug",
                table: "schedule_statuses",
                column: "slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "appointment_statuses");

            migrationBuilder.DropTable(
                name: "doctors");

            migrationBuilder.DropTable(
                name: "lab_report_statuses");

            migrationBuilder.DropTable(
                name: "patients");

            migrationBuilder.DropTable(
                name: "schedule_statuses");

            migrationBuilder.DropTable(
                name: "departments");

            migrationBuilder.DropIndex(
                name: "uq_users_email_active",
                table: "users");

            migrationBuilder.DropIndex(
                name: "uq_users_ic_active",
                table: "users");

            migrationBuilder.DropIndex(
                name: "uq_users_slug_active",
                table: "users");

            migrationBuilder.DropIndex(
                name: "uq_users_username_active",
                table: "users");

            migrationBuilder.DropCheckConstraint(
                name: "chk_users_dob_not_future",
                table: "users");

            migrationBuilder.DropCheckConstraint(
                name: "chk_users_gender",
                table: "users");

            migrationBuilder.AlterColumn<Instant>(
                name: "created_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()",
                oldClrType: typeof(Instant),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<string>(
                name: "avatar_url",
                table: "users",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<Instant>(
                name: "created_at",
                table: "user_roles",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()",
                oldClrType: typeof(Instant),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.AlterColumn<Instant>(
                name: "created_at",
                table: "roles",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()",
                oldClrType: typeof(Instant),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "now()");

            migrationBuilder.CreateIndex(
                name: "ix_users_slug",
                table: "users",
                column: "slug",
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CHK_Users_Dob_NotFuture",
                table: "users",
                sql: "date_of_birth <= CURRENT_DATE");

            migrationBuilder.AddCheckConstraint(
                name: "CHK_Users_Gender",
                table: "users",
                sql: "gender IN ('M', 'F', 'O', 'N')");
        }
    }
}
