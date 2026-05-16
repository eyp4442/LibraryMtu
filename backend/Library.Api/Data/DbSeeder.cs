using Library.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Data
{
    public static class DbSeeder
    {
        // Uygulama başlangıcında veritabanını hazırlar.
        // Migrationları uygular, temel rolleri ve demo kullanıcılarını oluşturur.
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            var context = serviceProvider.GetRequiredService<LibraryDbContext>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            // Bekleyen EF Core migrationları veritabanına uygular.
            await context.Database.MigrateAsync();

            var roles = new[] { "Admin", "Librarian", "User" };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            var admin = await EnsureUserAsync(
                userManager,
                username: "admin",
                email: "admin@library.local",
                password: "admin123",
                role: "Admin");

            var librarian = await EnsureUserAsync(
                userManager,
                username: "librarian1",
                email: "librarian1@library.local",
                password: "123456",
                role: "Librarian");

            var user = await EnsureUserAsync(
                userManager,
                username: "user1",
                email: "user1@library.local",
                password: "123456",
                role: "User");

            // User rolündeki demo hesabın MeController üzerinden çalışabilmesi için
            // ApplicationUser hesabına bağlı bir Member kaydı oluşturulur.
            if (!await context.Members.AnyAsync(x => x.UserId == user.Id))
            {
                context.Members.Add(new Member
                {
                    FullName = "User One",
                    Email = user.Email ?? "user1@library.local",
                    Phone = "05550000001",
                    Address = "Malatya",
                    UserId = user.Id
                });

                await context.SaveChangesAsync();
            }
        }

        // Verilen username'e sahip kullanıcı yoksa oluşturur.
        // Kullanıcı varsa tekrar oluşturmaz; eksik rol varsa role ekler.
        private static async Task<ApplicationUser> EnsureUserAsync(
            UserManager<ApplicationUser> userManager,
            string username,
            string email,
            string password,
            string role)
        {
            var user = await userManager.FindByNameAsync(username);

            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = username,
                    Email = email,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(user, password);

                if (!result.Succeeded)
                {
                    throw new Exception($"Seed user creation failed for {username}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
            }

            var roles = await userManager.GetRolesAsync(user);

            if (!roles.Contains(role))
            {
                await userManager.AddToRoleAsync(user, role);
            }

            return user;
        }
    }
}