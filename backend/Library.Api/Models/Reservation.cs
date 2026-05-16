namespace Library.Api.Models
{
    public class Reservation
    {
        public int Id { get; set; }

        public int MemberId { get; set; }
        public Member Member { get; set; } = null!;

        // Rezervasyon belirli bir fiziksel kopyaya değil, kitap kaydına yapılır.
        public int BookId { get; set; }
        public Book Book { get; set; } = null!;

        public DateTime ReservedAt { get; set; }
        public ReservationStatus Status { get; set; } = ReservationStatus.Active;
    }
}