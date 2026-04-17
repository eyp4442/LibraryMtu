namespace Library.Api.DTOs.BookCopies
{
    public class BookCopyItemDto
    {
        public int Id { get; set; }
        public int BookId { get; set; }
        public string Barcode { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class CreateBookCopyDto
    {
        public string Barcode { get; set; } = string.Empty;
    }
}