namespace Library.Api.DTOs.EmailChangeRequests
{
    public class CreateEmailChangeRequestDto
    {
        public string NewEmail { get; set; } = string.Empty;
    }

    public class RejectEmailChangeRequestDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class EmailChangeRequestItemDto
    {
        public int Id { get; set; }
        public int MemberId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string CurrentEmail { get; set; } = string.Empty;
        public string NewEmail { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? ReviewedByUserId { get; set; }
        public string? RejectReason { get; set; }
    }
}