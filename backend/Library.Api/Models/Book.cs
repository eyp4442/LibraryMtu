namespace Library.Api.Models
{
    public class Book
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

        // Geriye uyumluluk için tutulur.
        // Yeni akışta asıl kategori ilişkileri BookCategories üzerinden yönetilir.
        public int CategoryId { get; set; }
        public Category Category { get; set; } = null!;

        // Çoklu kategori ilişkisi.
        public ICollection<BookCategory> BookCategories { get; set; } = new List<BookCategory>();

        // Kitabın kütüphanedeki fiziksel nüshaları BookCopy üzerinden yönetilir.
        public ICollection<BookCopy> Copies { get; set; } = new List<BookCopy>();

        // Kitaba ait kapak/galeri görselleri.
        public ICollection<BookImage> Images { get; set; } = new List<BookImage>();

        public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    }
}