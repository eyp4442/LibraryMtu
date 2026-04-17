namespace Library.Api.DTOs.Loans
{
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
    public class RequestReturnDto
    {
        public string Note { get; set; } = string.Empty;
    }
    public class CheckoutLoanDto
    {
        public int MemberId { get; set; }
        public int CopyId { get; set; }
        public DateTime DueDate { get; set; }
    }

    public class RejectReturnDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class ReturnLoanDto
    {
        public int LoanId { get; set; }
    }
}