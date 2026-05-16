namespace Library.Api.DTOs.Books
{
    // Kitabın fiziksel kopyalarına ait stok durumunu özetleyen response DTO'su.
    // Bu bilgi BookCopy kayıtlarının durumlarına göre hesaplanır.
    public class StockSummaryDto
    {
        public int Total { get; set; }
        public int Available { get; set; }
        public int Loaned { get; set; }
        public int Reserved { get; set; }
        public int PendingReturnApproval { get; set; }
    }

    // Kitap listeleme ve temel kitap gösterimi için kullanılan response DTO'su.
    // Kitap bilgileriyle birlikte kategori ve stok özetini de frontend'e taşır.
    public class BookListItemDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string Isbn { get; set; } = string.Empty;
        public int PublishedYear { get; set; }
        public string Publisher { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public int PageCount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }

        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;

        public int AvailableCopyCount { get; set; }
        public int TotalCopyCount { get; set; }

        public StockSummaryDto StockSummary { get; set; } = new();
    }

    // Şu an liste DTO'su ile aynı alanları taşır.
    // Ayrı tutulması, ileride kitap detayına özel alanlar eklenebilmesini kolaylaştırır.
    public class BookDetailDto : BookListItemDto
    {
    }

    // Yeni kitap oluştururken frontend'den gelen request modelidir.
    // Fiziksel kopya bilgileri burada yer almaz; kopyalar BookCopies modülüyle ayrıca eklenir.
    public class CreateBookDto
    {
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string Isbn { get; set; } = string.Empty;
        public int PublishedYear { get; set; }
        public string Publisher { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public int PageCount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }
        public int CategoryId { get; set; }
    }

    // Mevcut kitap bilgilerini güncellemek için kullanılan request modelidir.
    public class UpdateBookDto
    {
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string Isbn { get; set; } = string.Empty;
        public int PublishedYear { get; set; }
        public string Publisher { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public int PageCount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }
        public int CategoryId { get; set; }
    }
}