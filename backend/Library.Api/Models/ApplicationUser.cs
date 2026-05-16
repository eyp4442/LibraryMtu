using Microsoft.AspNetCore.Identity;

namespace Library.Api.Models
{
    public class ApplicationUser : IdentityUser
    {
        // Identity hesabı ile kütüphane üye kaydı arasındaki birebir bağlantıdır.
        public Member? Member { get; set; }
    }
}