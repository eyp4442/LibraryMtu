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

        public int CategoryId { get; set; }
        public Category Category { get; set; } = null!;

        public ICollection<BookCopy> Copies { get; set; } = new List<BookCopy>();
        public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    }
}