using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Library.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddReservationCopyAndExpiry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CopyId",
                table: "Reservations",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiresAt",
                table: "Reservations",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_CopyId",
                table: "Reservations",
                column: "CopyId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_ExpiresAt",
                table: "Reservations",
                column: "ExpiresAt");

            migrationBuilder.AddForeignKey(
                name: "FK_Reservations_BookCopies_CopyId",
                table: "Reservations",
                column: "CopyId",
                principalTable: "BookCopies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reservations_BookCopies_CopyId",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_CopyId",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_ExpiresAt",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "CopyId",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "Reservations");
        }
    }
}
