namespace Library.Api.Models
{
    public class Loan
    {
        public int Id { get; set; }

        public int MemberId { get; set; }
        public Member Member { get; set; } = null!;

        // Ödünç işlemi kitap kaydına değil, fiziksel BookCopy kaydına bağlanır.
        public int CopyId { get; set; }
        public BookCopy Copy { get; set; } = null!;

        public DateTime LoanDate { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime? ReturnDate { get; set; }

        public LoanStatus Status { get; set; } = LoanStatus.Active;
        public int RenewCount { get; set; }

        // Kullanıcı iade talebi oluşturduğunda zaman bilgisi burada tutulur.
        public DateTime? ReturnRequestedAt { get; set; }
    }
}