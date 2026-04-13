namespace Library.Api.Models
{
    public class BookCopy
    {
        public int Id { get; set; }

        public int BookId { get; set; }
        public Book Book { get; set; } = null!;

        public string Barcode { get; set; } = string.Empty;
        public BookCopyStatus Status { get; set; } = BookCopyStatus.Available;

        public ICollection<Loan> Loans { get; set; } = new List<Loan>();
    }
}