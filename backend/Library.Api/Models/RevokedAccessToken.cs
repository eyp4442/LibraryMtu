namespace Library.Api.Models
{
    public class RevokedAccessToken
    {
        public int Id { get; set; }

        public string Jti { get; set; } = string.Empty;
        public string? UserId { get; set; }

        public DateTime ExpiresAt { get; set; }
        public DateTime RevokedAt { get; set; } = DateTime.UtcNow;

        public string? Reason { get; set; }
    }
}