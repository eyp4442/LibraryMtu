namespace Library.Api.Models
{
    public class Member
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;

        // Login hesabı ile member profilini bağlar.
        // Manuel oluşturulan üyelerde null olabilir; kullanıcı paneli için dolu olması beklenir.
        public string? UserId { get; set; }
        public ApplicationUser? User { get; set; }

        public ICollection<Loan> Loans { get; set; } = new List<Loan>();
        public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    }
}