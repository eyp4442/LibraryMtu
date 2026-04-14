using Microsoft.AspNetCore.Identity;

namespace Library.Api.Models
{
    public class ApplicationUser : IdentityUser
    {
        public Member? Member { get; set; }
    }
}