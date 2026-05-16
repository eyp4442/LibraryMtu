namespace Library.Api.DTOs.Members
{
    // Üye listeleme ekranlarında kullanılan temel response DTO'su.
    // Admin/Librarian tarafındaki üye yönetimi ekranına gerekli bilgileri taşır.
    public class MemberListItemDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
    }

    // Tekil üye detayında kullanılan response DTO'su.
    // Şu an liste DTO'su ile aynı alanlara sahiptir; ileride detay alanları eklenebilir.
    public class MemberDetailDto : MemberListItemDto
    {
    }

    // Admin veya Librarian tarafından yeni üye oluşturmak için kullanılan request DTO'su.
    public class CreateMemberDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
    }

    // Admin veya Librarian tarafından mevcut üye bilgilerini güncellemek için kullanılan request DTO'su.
    public class UpdateMemberDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
    }
}