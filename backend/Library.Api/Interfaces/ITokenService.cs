using Library.Api.Models;

namespace Library.Api.Interfaces
{
    // JWT access token ve refresh token işlemleri için kullanılan servis sözleşmesidir.
    public interface ITokenService
    {
        string CreateAccessToken(ApplicationUser user, IList<string> roles);
        string CreateRefreshToken();

        // Refresh token veritabanında açık haliyle değil, hashlenmiş haliyle saklanır.
        string HashToken(string token);

        DateTime GetRefreshTokenExpiryUtc();
        int GetAccessTokenExpiresInSeconds();
    }
}