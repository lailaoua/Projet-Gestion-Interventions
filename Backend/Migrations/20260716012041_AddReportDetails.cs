using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pfa1.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddReportDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Diagnostic",
                table: "Reports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EndTime",
                table: "Reports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PartsReplaced",
                table: "Reports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Recommendations",
                table: "Reports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StartTime",
                table: "Reports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TestsPerformed",
                table: "Reports",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Diagnostic",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "EndTime",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "PartsReplaced",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "Recommendations",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "StartTime",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "TestsPerformed",
                table: "Reports");
        }
    }
}
