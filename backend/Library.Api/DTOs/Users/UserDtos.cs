namespace Library.Api.DTOs.Users
{
    // Admin panelinde kullanıcı hesaplarını listelemek için kullanılan response DTO'su.
    public class UserListItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    // Admin tarafından yeni sistem kullanıcısı oluşturmak için kullanılan request DTO'su.
    // Normal kullanıcı başvuruları için asıl akış RegistrationRequest üzerinden yürür.
    public class CreateUserDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    // Mevcut bir kullanıcının rolünü değiştirmek için kullanılan request DTO'su.
    public class UpdateUserRoleDto
    {
        public string Role { get; set; } = string.Empty;
    }
}