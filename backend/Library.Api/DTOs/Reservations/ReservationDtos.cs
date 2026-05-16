namespace Library.Api.DTOs.Reservations
{
    // Rezervasyon bilgilerini frontend'e döndürmek için kullanılan response DTO'su.
    // Üye, kitap, rezervasyon tarihi ve durum bilgisini taşır.
    public class ReservationItemDto
    {
        public int Id { get; set; }
        public int MemberId { get; set; }
        public int BookId { get; set; }
        public DateTime ReservedAt { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    // Yeni rezervasyon oluşturmak için kullanılan request DTO'su.
    public class CreateReservationDto
    {
        public int MemberId { get; set; }
        public int BookId { get; set; }
    }
}