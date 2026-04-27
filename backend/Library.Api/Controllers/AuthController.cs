using System.Security.Claims;
using Library.Api.DTOs.Auth;
using Library.Api.Interfaces;
using Library.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Library.Api.Data;
using Library.Api.DTOs.RegistrationRequests;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _configuration;
        private readonly LibraryDbContext _context;
        private readonly IPasswordHasher<ApplicationUser> _passwordHasher;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            ITokenService tokenService,
            IConfiguration configuration,
            LibraryDbContext context,
            IPasswordHasher<ApplicationUser> passwordHasher)
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _configuration = configuration;
            _context = context;
            _passwordHasher = passwordHasher;
        }

        [AllowAnonymous]
[HttpPost("register-request")]
public async Task<IActionResult> RegisterRequest([FromBody] CreateRegistrationRequestDto dto)
{
    var details = new List<object>();

    if (string.IsNullOrWhiteSpace(dto.FullName))
        details.Add(new { field = "fullName", message = "Required" });

    if (string.IsNullOrWhiteSpace(dto.Email))
        details.Add(new { field = "email", message = "Required" });

    if (string.IsNullOrWhiteSpace(dto.Username))
        details.Add(new { field = "username", message = "Required" });

    if (string.IsNullOrWhiteSpace(dto.Password))
        details.Add(new { field = "password", message = "Required" });

    if (string.IsNullOrWhiteSpace(dto.Phone))
        details.Add(new { field = "phone", message = "Required" });

    if (string.IsNullOrWhiteSpace(dto.Address))
        details.Add(new { field = "address", message = "Required" });

    if (!string.IsNullOrWhiteSpace(dto.Password) && dto.Password.Trim().Length < 6)
        details.Add(new { field = "password", message = "Must be at least 6 characters" });

    if (details.Count > 0)
    {
        return BadRequest(new
        {
            error = new
            {
                code = "VALIDATION_ERROR",
                message = "Validation failed",
                details
            }
        });
    }

    var normalizedEmail = dto.Email.Trim().ToLower();
    var normalizedUsername = dto.Username.Trim();

    var existingUserByName = await _userManager.FindByNameAsync(normalizedUsername);
    if (existingUserByName != null)
    {
        return BadRequest(new
        {
            error = new
            {
                code = "USERNAME_ALREADY_EXISTS",
                message = "Username already exists"
            }
        });
    }

    var existingUserByEmail = await _userManager.FindByEmailAsync(dto.Email.Trim());
    if (existingUserByEmail != null)
    {
        return BadRequest(new
        {
            error = new
            {
                code = "EMAIL_ALREADY_EXISTS",
                message = "Email already exists"
            }
        });
    }

    var pendingUsernameExists = await _context.RegistrationRequests
        .AnyAsync(x => x.Username == normalizedUsername && x.Status == Models.RegistrationRequestStatus.Pending);

    if (pendingUsernameExists)
    {
        return BadRequest(new
        {
            error = new
            {
                code = "REGISTRATION_REQUEST_ALREADY_EXISTS",
                message = "A pending request already exists for this username"
            }
        });
    }

    var pendingEmailExists = await _context.RegistrationRequests
        .AnyAsync(x => x.Email.ToLower() == normalizedEmail && x.Status == Models.RegistrationRequestStatus.Pending);

    if (pendingEmailExists)
    {
        return BadRequest(new
        {
            error = new
            {
                code = "REGISTRATION_REQUEST_ALREADY_EXISTS",
                message = "A pending request already exists for this email"
            }
        });
    }

    var passwordHash = _passwordHasher.HashPassword(
        new ApplicationUser { UserName = normalizedUsername, Email = dto.Email.Trim() },
        dto.Password.Trim());

    var request = new Models.RegistrationRequest
    {
        FullName = dto.FullName.Trim(),
        Email = dto.Email.Trim(),
        Username = normalizedUsername,
        PasswordHash = passwordHash,
        Phone = dto.Phone.Trim(),
        Address = dto.Address.Trim(),
        Status = Models.RegistrationRequestStatus.Pending,
        CreatedAt = DateTime.UtcNow
    };

    _context.RegistrationRequests.Add(request);
    await _context.SaveChangesAsync();

    return Ok(new
    {
        message = "Registration request submitted successfully and is awaiting approval.",
        requestId = request.Id,
        status = request.Status.ToString()
    });
}

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "VALIDATION_ERROR",
                        message = "Username and password are required"
                    }
                });
            }

            var user = await _userManager.FindByNameAsync(dto.Username.Trim());

            if (user == null)
            {
                return Unauthorized(new
                {
                    error = new
                    {
                        code = "AUTH_INVALID_CREDENTIALS",
                        message = "Invalid username or password"
                    }
                });
            }

            var passwordValid = await _userManager.CheckPasswordAsync(user, dto.Password);

            if (!passwordValid)
            {
                return Unauthorized(new
                {
                    error = new
                    {
                        code = "AUTH_INVALID_CREDENTIALS",
                        message = "Invalid username or password"
                    }
                });
            }

            var roles = await _userManager.GetRolesAsync(user);
            var accessToken = _tokenService.CreateAccessToken(user, roles);

            var expiresIn = int.TryParse(_configuration["Jwt:ExpiresInMinutes"], out var minutes)
                ? minutes * 60
                : 3600;

            var response = new LoginResponseDto
            {
                AccessToken = accessToken,
                ExpiresIn = expiresIn,
                Role = roles.FirstOrDefault() ?? "User"
            };

            return Ok(response);
        }

        [Authorize]
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            return Ok(new
            {
                message = "Client should remove the stored token to complete logout."
            });
        }

        [Authorize]
        [HttpGet("me")]
        public IActionResult Me()
        {
            var username = User.Identity?.Name;
            var roles = User.Claims
                .Where(x => x.Type == ClaimTypes.Role)
                .Select(x => x.Value)
                .ToList();

            return Ok(new
            {
                username,
                roles
            });
        }
    }
}