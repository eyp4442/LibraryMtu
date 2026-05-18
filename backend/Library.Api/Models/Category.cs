namespace Library.Api.Models
{
    public class Category
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        // Geriye uyumluluk için tutulur.
        public ICollection<Book> Books { get; set; } = new List<Book>();

        // Çoklu kategori ilişkisi.
        public ICollection<BookCategory> BookCategories { get; set; } = new List<BookCategory>();
    }
}