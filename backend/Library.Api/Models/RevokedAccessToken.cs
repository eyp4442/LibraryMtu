namespace Library.Api.Models
{
    public class RevokedAccessToken
    {
        public int Id { get; set; }

        // JWT içindeki benzersiz token kimliğidir.
        // Logout sonrası aynı access token'ın tekrar kullanılmasını engellemek için saklanır.
        public string Jti { get; set; } = string.Empty;

        public string? UserId { get; set; }

        // Revoke kaydı, access token'ın doğal süresi bitene kadar anlamlıdır.
        public DateTime ExpiresAt { get; set; }

        public DateTime RevokedAt { get; set; } = DateTime.UtcNow;

        public string? Reason { get; set; }
    }
}