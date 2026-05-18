namespace Library.Api.DTOs.Users
{
    public class UserListItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;

        // Frontend kendi hesabını ayırt edebilsin diye döndürülür.
        public bool IsCurrentUser { get; set; }

        // Frontend rol değiştirme select'ini güvenli şekilde pasifleştirebilsin diye döndürülür.
        public bool CanChangeRole { get; set; } = true;

        public string RoleChangeDisabledReason { get; set; } = string.Empty;
    }

    public class CreateUserDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class UpdateUserRoleDto
    {
        public string Role { get; set; } = string.Empty;
    }
}