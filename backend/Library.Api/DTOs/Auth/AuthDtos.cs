namespace Library.Api.DTOs.Auth
{
    // Kullanıcının sisteme giriş yaparken gönderdiği veriyi temsil eder.
    public class LoginRequestDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    // Login ve refresh işlemlerinden sonra frontend'e dönen token bilgisini temsil eder.
    public class LoginResponseDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public int ExpiresIn { get; set; }
        public string Role { get; set; } = string.Empty;

        public string RefreshToken { get; set; } = string.Empty;
        public DateTime RefreshTokenExpiresAt { get; set; }
    }

    // Access token süresi dolduğunda yeni token almak için kullanılan request modelidir.
    public class RefreshTokenRequestDto
    {
        public string RefreshToken { get; set; } = string.Empty;
    }

    // Logout sırasında refresh token'ın iptal edilmesi için kullanılan request modelidir.
    public class LogoutRequestDto
    {
        public string RefreshToken { get; set; } = string.Empty;
    }
}