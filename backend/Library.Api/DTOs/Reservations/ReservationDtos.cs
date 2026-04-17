namespace Library.Api.DTOs.Reservations
{
    public class ReservationItemDto
    {
        public int Id { get; set; }
        public int MemberId { get; set; }
        public int BookId { get; set; }
        public DateTime ReservedAt { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class CreateReservationDto
    {
        public int MemberId { get; set; }
        public int BookId { get; set; }
    }
}