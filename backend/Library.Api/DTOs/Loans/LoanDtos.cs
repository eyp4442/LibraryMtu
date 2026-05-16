namespace Library.Api.DTOs.Loans
{
    // Loan kayıtlarını frontend'e döndürmek için kullanılan response DTO'su.
    // Üye, fiziksel kopya, tarih bilgileri ve loan durumunu taşır.
    public class LoanItemDto
    {
        public int Id { get; set; }
        public int MemberId { get; set; }
        public int CopyId { get; set; }
        public DateTime LoanDate { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime? ReturnDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public int RenewCount { get; set; }
        public DateTime? ReturnRequestedAt { get; set; }
    }

    // Kullanıcının kendi panelinden iade talebi oluşturması için kullanılan request modelidir.
    // Not alanı ileride görevliye açıklama iletmek için kullanılabilir.
    public class RequestReturnDto
    {
        public string Note { get; set; } = string.Empty;
    }

    // Görevlinin bir üyeye fiziksel kitap kopyası ödünç vermesi için kullanılan request modelidir.
    public class CheckoutLoanDto
    {
        public int MemberId { get; set; }
        public int CopyId { get; set; }
        public DateTime DueDate { get; set; }
    }

    // Görevlinin iade talebini reddederken sebep belirtebilmesi için kullanılan request modelidir.
    public class RejectReturnDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    // Görevlinin doğrudan iade alma işlemi için kullanılan request modelidir.
    public class ReturnLoanDto
    {
        public int LoanId { get; set; }
    }
}