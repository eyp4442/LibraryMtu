using Library.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Data
{
    public class LibraryDbContext : IdentityDbContext<ApplicationUser, IdentityRole, string>
    {
        public LibraryDbContext(DbContextOptions<LibraryDbContext> options) : base(options)
        {
        }
        public DbSet<EmailChangeRequest> EmailChangeRequests => Set<EmailChangeRequest>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Book> Books => Set<Book>();
        public DbSet<BookCopy> BookCopies => Set<BookCopy>();
        public DbSet<Member> Members => Set<Member>();
        public DbSet<Loan> Loans => Set<Loan>();
        public DbSet<Reservation> Reservations => Set<Reservation>();
        public DbSet<RegistrationRequest> RegistrationRequests => Set<RegistrationRequest>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<RevokedAccessToken> RevokedAccessTokens => Set<RevokedAccessToken>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<Category>()
                .HasIndex(x => x.Name)
                .IsUnique();

            builder.Entity<Book>()
                .HasIndex(x => x.Isbn)
                .IsUnique();

            builder.Entity<BookCopy>()
                .HasIndex(x => x.Barcode)
                .IsUnique();

            builder.Entity<Member>()
                .HasIndex(x => x.Email)
                .IsUnique();

            builder.Entity<Member>()
                .HasOne(x => x.User)
                .WithOne(x => x.Member)
                .HasForeignKey<Member>(x => x.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<Book>()
                .HasOne(x => x.Category)
                .WithMany(x => x.Books)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<BookCopy>()
                .HasOne(x => x.Book)
                .WithMany(x => x.Copies)
                .HasForeignKey(x => x.BookId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Loan>()
                .HasOne(x => x.Member)
                .WithMany(x => x.Loans)
                .HasForeignKey(x => x.MemberId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Loan>()
                .HasOne(x => x.Copy)
                .WithMany(x => x.Loans)
                .HasForeignKey(x => x.CopyId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Reservation>()
                .HasOne(x => x.Member)
                .WithMany(x => x.Reservations)
                .HasForeignKey(x => x.MemberId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Reservation>()
                .HasOne(x => x.Book)
                .WithMany(x => x.Reservations)
                .HasForeignKey(x => x.BookId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<BookCopy>()
                .Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(50);

            builder.Entity<Loan>()
                .Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(50);

            builder.Entity<Reservation>()
                .Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(50);

            builder.Entity<RegistrationRequest>(entity =>
{
    entity.Property(x => x.FullName).IsRequired().HasMaxLength(150);
    entity.Property(x => x.Email).IsRequired().HasMaxLength(150);
    entity.Property(x => x.Username).IsRequired().HasMaxLength(100);
    entity.Property(x => x.PasswordHash).IsRequired();
    entity.Property(x => x.Phone).IsRequired().HasMaxLength(30);
    entity.Property(x => x.Address).IsRequired().HasMaxLength(300);
    entity.Property(x => x.RejectReason).HasMaxLength(500);

    entity.HasIndex(x => x.Email);
    entity.HasIndex(x => x.Username);
    entity.HasIndex(x => x.Status);
});

        builder.Entity<EmailChangeRequest>(entity =>
{
    entity.Property(x => x.UserId).IsRequired();
    entity.Property(x => x.CurrentEmail).IsRequired().HasMaxLength(150);
    entity.Property(x => x.NewEmail).IsRequired().HasMaxLength(150);
    entity.Property(x => x.RejectReason).HasMaxLength(500);

    entity.HasIndex(x => x.MemberId);
    entity.HasIndex(x => x.UserId);
    entity.HasIndex(x => x.NewEmail);
    entity.HasIndex(x => x.Status);

    entity.HasOne(x => x.Member)
        .WithMany()
        .HasForeignKey(x => x.MemberId)
        .OnDelete(DeleteBehavior.Cascade);
});

        builder.Entity<RefreshToken>(entity =>
{
    entity.Property(x => x.TokenHash).IsRequired().HasMaxLength(128);
    entity.Property(x => x.UserId).IsRequired();

    entity.HasIndex(x => x.TokenHash).IsUnique();
    entity.HasIndex(x => x.UserId);
    entity.HasIndex(x => x.ExpiresAt);

    entity.HasOne(x => x.User)
        .WithMany()
        .HasForeignKey(x => x.UserId)
        .OnDelete(DeleteBehavior.Cascade);
});

        builder.Entity<RevokedAccessToken>(entity =>
{
    entity.Property(x => x.Jti).IsRequired().HasMaxLength(100);

    entity.HasIndex(x => x.Jti).IsUnique();
    entity.HasIndex(x => x.ExpiresAt);
});
        }
    }
}