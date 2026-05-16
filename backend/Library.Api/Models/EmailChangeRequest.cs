namespace Library.Api.Models
{
    public class EmailChangeRequest
    {
        public int Id { get; set; }

        public int MemberId { get; set; }
        public Member Member { get; set; } = null!;

        // Identity kullanıcısını bulmak için kullanılır.
        public string UserId { get; set; } = string.Empty;

        public string CurrentEmail { get; set; } = string.Empty;
        public string NewEmail { get; set; } = string.Empty;

        public EmailChangeRequestStatus Status { get; set; } = EmailChangeRequestStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }

        // Talebi inceleyen Admin/Librarian kullanıcısının id bilgisidir.
        public string? ReviewedByUserId { get; set; }

        public string? RejectReason { get; set; }
    }
}