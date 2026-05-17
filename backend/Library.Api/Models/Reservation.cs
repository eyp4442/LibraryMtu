namespace Library.Api.Models
{
    public class Reservation
    {
        public int Id { get; set; }

        public int MemberId { get; set; }
        public Member Member { get; set; } = null!;

        public int BookId { get; set; }
        public Book Book { get; set; } = null!;

        // Rezervasyon artık mümkünse belirli bir fiziksel kopyaya bağlanır.
        // Müsait bir kopya ayırtıldığında bu CopyId dolu olur.
        public int? CopyId { get; set; }
        public BookCopy? Copy { get; set; }

        public DateTime ReservedAt { get; set; } = DateTime.UtcNow;

        // Rezervasyonun geçerlilik süresi.
        // Test için 1 dk, 2 dk, 1 saat, 12 saat, 24 saat gibi değerlerle oluşturulacak.
        public DateTime? ExpiresAt { get; set; }

        public ReservationStatus Status { get; set; } = ReservationStatus.Active;
    }
}