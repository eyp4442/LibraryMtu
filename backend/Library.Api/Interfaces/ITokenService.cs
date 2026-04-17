using Library.Api.Models;

namespace Library.Api.Interfaces
{
    public interface ITokenService
    {
        string CreateAccessToken(ApplicationUser user, IList<string> roles);
    }
}