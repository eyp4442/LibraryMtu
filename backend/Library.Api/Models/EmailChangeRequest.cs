namespace Library.Api.Models
{
    public class EmailChangeRequest
    {
        public int Id { get; set; }

        public int MemberId { get; set; }
        public Member Member { get; set; } = null!;

        public string UserId { get; set; } = string.Empty;
        public string CurrentEmail { get; set; } = string.Empty;
        public string NewEmail { get; set; } = string.Empty;

        public EmailChangeRequestStatus Status { get; set; } = EmailChangeRequestStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReviewedAt { get; set; }

        public string? ReviewedByUserId { get; set; }
        public string? RejectReason { get; set; }
    }
}