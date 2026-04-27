using Library.Api.Models;

namespace Library.Api.Interfaces
{
    public interface ITokenService
    {
        string CreateAccessToken(ApplicationUser user, IList<string> roles);
        string CreateRefreshToken();
        string HashToken(string token);
        DateTime GetRefreshTokenExpiryUtc();
        int GetAccessTokenExpiresInSeconds();
    }
}