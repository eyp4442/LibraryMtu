namespace Library.Api.DTOs.Profile
{
    // Kullanıcının kendi profilindeki temel üye bilgilerini güncellemek için kullanılan request DTO'su.
    // Email bu DTO içinde yer almaz; email değişikliği ayrı onaylı talep akışıyla yönetilir.
    public class UpdateMyProfileDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
    }

    // Kullanıcının kendi profil bilgisini frontend'e döndürmek için kullanılan response DTO'su.
    // Identity tarafındaki ApplicationUser bilgileri ile kütüphane tarafındaki Member bilgilerini birleştirir.
    public class MyProfileDto
    {
        public int MemberId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
    }
}