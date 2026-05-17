namespace Library.Api.DTOs.Reservations
{
    public class ReservationItemDto
    {
        public int Id { get; set; }

        public int MemberId { get; set; }
        public string? MemberFullName { get; set; }

        public int BookId { get; set; }
        public string? BookTitle { get; set; }

        public int? CopyId { get; set; }
        public string? CopyBarcode { get; set; }

        public DateTime ReservedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }

        public string Status { get; set; } = string.Empty;
    }

    public class CreateReservationDto
    {
        public int MemberId { get; set; }
        public int BookId { get; set; }

        // İzin verilen değerler:
        // 1    = 1 dakika
        // 2    = 2 dakika
        // 60   = 1 saat
        // 720  = 12 saat
        // 1440 = 24 saat
        public int HoldMinutes { get; set; } = 1440;
    }

    public class CheckoutReservationDto
    {
        public DateTime DueDate { get; set; }
    }
}