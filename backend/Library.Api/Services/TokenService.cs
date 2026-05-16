using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Library.Api.Interfaces;
using Library.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace Library.Api.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;

        public TokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        // Kullanıcının kimlik ve rol bilgilerini taşıyan JWT access token oluşturur.
        public string CreateAccessToken(ApplicationUser user, IList<string> roles)
        {
            var key = _configuration["Jwt:Key"]
                      ?? throw new InvalidOperationException("Jwt:Key not found.");

            var issuer = _configuration["Jwt:Issuer"]
                         ?? throw new InvalidOperationException("Jwt:Issuer not found.");

            var audience = _configuration["Jwt:Audience"]
                           ?? throw new InvalidOperationException("Jwt:Audience not found.");

            var expiresInMinutes = int.TryParse(_configuration["Jwt:ExpiresInMinutes"], out var minutes)
                ? minutes
                : 60;

            var claims = new List<Claim>
            {
                // Kullanıcı id bilgisi farklı standart claim adlarıyla eklenir.
                // Böylece controller tarafında user id güvenilir şekilde okunabilir.
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(ClaimTypes.NameIdentifier, user.Id),

                new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName ?? string.Empty),

                // Token'ın benzersiz kimliğidir.
                // Logout sonrası access token revoke listesine bu değerle eklenir.
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            if (!string.IsNullOrWhiteSpace(user.Email))
            {
                claims.Add(new Claim(ClaimTypes.Email, user.Email));
            }

            // Role claim'leri Authorize(Roles = "...") kontrollerinin çalışmasını sağlar.
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiresInMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // Kriptografik olarak güvenli rastgele refresh token üretir.
        public string CreateRefreshToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(64);
            return Base64UrlEncoder.Encode(bytes);
        }

        // Refresh token veritabanında açık haliyle saklanmaz.
        // Karşılaştırma yapılabilmesi için SHA256 hash değeri tutulur.
        public string HashToken(string token)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(bytes);
        }

        // Refresh token geçerlilik süresini config değerine göre hesaplar.
        public DateTime GetRefreshTokenExpiryUtc()
        {
            var days = int.TryParse(_configuration["Jwt:RefreshTokenExpiresInDays"], out var parsedDays)
                ? parsedDays
                : 7;

            return DateTime.UtcNow.AddDays(days);
        }

        // Frontend'in access token süresini takip edebilmesi için süreyi saniye cinsinden döndürür.
        public int GetAccessTokenExpiresInSeconds()
        {
            var minutes = int.TryParse(_configuration["Jwt:ExpiresInMinutes"], out var parsedMinutes)
                ? parsedMinutes
                : 60;

            return minutes * 60;
        }
    }
}