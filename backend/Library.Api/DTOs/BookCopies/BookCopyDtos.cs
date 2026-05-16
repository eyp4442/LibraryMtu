namespace Library.Api.DTOs.BookCopies 
{
    // Kitap kopyası bilgilerini frontend'e döndürmek için kullanılan response DTO'su.
    // Fiziksel kopyanın hangi kitaba ait olduğunu, barkodunu ve mevcut durumunu taşır.
    public class BookCopyItemDto
    {
        public int Id { get; set; }
        public int BookId { get; set; }
        public string Barcode { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    // Belirli bir kitaba yeni fiziksel kopya eklerken kullanılan request DTO'su.
    // BookId URL üzerinden alındığı için burada sadece barkod bilgisi bulunur.
    public class CreateBookCopyDto
    {
        public string Barcode { get; set; } = string.Empty;
    }
}