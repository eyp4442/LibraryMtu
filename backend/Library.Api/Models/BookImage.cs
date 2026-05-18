namespace Library.Api.Models
{
    public class BookImage
    {
        public int Id { get; set; }

        public int BookId { get; set; }
        public Book Book { get; set; } = null!;

        public string ImageUrl { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}