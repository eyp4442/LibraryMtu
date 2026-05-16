namespace Library.Api.DTOs.EmailChangeRequests
{
    // Kullanıcının kendi panelinden yeni e-posta talebi oluştururken gönderdiği request modelidir.
    public class CreateEmailChangeRequestDto
    {
        public string NewEmail { get; set; } = string.Empty;
    }

    // Admin veya Librarian tarafından e-posta değişiklik talebi reddedilirken kullanılan request modelidir.
    public class RejectEmailChangeRequestDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    // E-posta değişiklik taleplerini yönetim ekranında listelemek için kullanılan response DTO'su.
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