namespace Library.Api.Models
{
    public class BookCopy
    {
        public int Id { get; set; }

        public int BookId { get; set; }
        public Book Book { get; set; } = null!;

        // Fiziksel kitap kopyasını benzersiz şekilde tanımlar.
        public string Barcode { get; set; } = string.Empty;

        public BookCopyStatus Status { get; set; } = BookCopyStatus.Available;

        // Bu fiziksel kopyaya ait ödünç geçmişi.
        public ICollection<Loan> Loans { get; set; } = new List<Loan>();
    }
}