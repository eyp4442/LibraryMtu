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

        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Book> Books => Set<Book>();
        public DbSet<BookCopy> BookCopies => Set<BookCopy>();
        public DbSet<Member> Members => Set<Member>();
        public DbSet<Loan> Loans => Set<Loan>();
        public DbSet<Reservation> Reservations => Set<Reservation>();

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
        }
    }
}