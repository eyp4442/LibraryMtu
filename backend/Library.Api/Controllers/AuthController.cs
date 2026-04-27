using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Library.Api.Data;
using Library.Api.DTOs.Auth;
using Library.Api.DTOs.RegistrationRequests;
using Library.Api.Interfaces;
using Library.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ITokenService _tokenService;
        private readonly LibraryDbContext _context;
        private readonly IPasswordHasher<ApplicationUser> _passwordHasher;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            ITokenService tokenService,
            LibraryDbContext context,
            IPasswordHasher<ApplicationUser> passwordHasher)
        {
            _userManager = userManager;
            _tokenService = tokenService;
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
                .AnyAsync(x => x.Username == normalizedUsername && x.Status == RegistrationRequestStatus.Pending);

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
                .AnyAsync(x => x.Email.ToLower() == normalizedEmail && x.Status == RegistrationRequestStatus.Pending);

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

            var request = new RegistrationRequest
            {
                FullName = dto.FullName.Trim(),
                Email = dto.Email.Trim(),
                Username = normalizedUsername,
                PasswordHash = passwordHash,
                Phone = dto.Phone.Trim(),
                Address = dto.Address.Trim(),
                Status = RegistrationRequestStatus.Pending,
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
            var rawRefreshToken = _tokenService.CreateRefreshToken();
            var refreshTokenExpiry = _tokenService.GetRefreshTokenExpiryUtc();

            var refreshToken = new RefreshToken
            {
                UserId = user.Id,
                TokenHash = _tokenService.HashToken(rawRefreshToken),
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = refreshTokenExpiry
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            var response = new LoginResponseDto
            {
                AccessToken = accessToken,
                ExpiresIn = _tokenService.GetAccessTokenExpiresInSeconds(),
                Role = roles.FirstOrDefault() ?? "User",
                RefreshToken = rawRefreshToken,
                RefreshTokenExpiresAt = refreshTokenExpiry
            };

            return Ok(response);
        }

        [AllowAnonymous]
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.RefreshToken))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "VALIDATION_ERROR",
                        message = "Refresh token is required"
                    }
                });
            }

            var incomingHash = _tokenService.HashToken(dto.RefreshToken.Trim());

            var existingRefreshToken = await _context.RefreshTokens
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.TokenHash == incomingHash);

            if (existingRefreshToken == null)
            {
                return Unauthorized(new
                {
                    error = new
                    {
                        code = "INVALID_REFRESH_TOKEN",
                        message = "Refresh token is invalid"
                    }
                });
            }

            if (existingRefreshToken.RevokedAt != null || existingRefreshToken.ExpiresAt <= DateTime.UtcNow)
            {
                return Unauthorized(new
                {
                    error = new
                    {
                        code = "INVALID_REFRESH_TOKEN",
                        message = "Refresh token is expired or revoked"
                    }
                });
            }

            var user = existingRefreshToken.User;
            var roles = await _userManager.GetRolesAsync(user);

            var newAccessToken = _tokenService.CreateAccessToken(user, roles);
            var newRawRefreshToken = _tokenService.CreateRefreshToken();
            var newRefreshTokenExpiry = _tokenService.GetRefreshTokenExpiryUtc();
            var newRefreshTokenHash = _tokenService.HashToken(newRawRefreshToken);

            existingRefreshToken.RevokedAt = DateTime.UtcNow;
            existingRefreshToken.ReasonRevoked = "Rotated";
            existingRefreshToken.ReplacedByTokenHash = newRefreshTokenHash;

            var newRefreshToken = new RefreshToken
            {
                UserId = user.Id,
                TokenHash = newRefreshTokenHash,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = newRefreshTokenExpiry
            };

            _context.RefreshTokens.Add(newRefreshToken);
            await _context.SaveChangesAsync();

            var response = new LoginResponseDto
            {
                AccessToken = newAccessToken,
                ExpiresIn = _tokenService.GetAccessTokenExpiresInSeconds(),
                Role = roles.FirstOrDefault() ?? "User",
                RefreshToken = newRawRefreshToken,
                RefreshTokenExpiresAt = newRefreshTokenExpiry
            };

            return Ok(response);
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogoutRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.RefreshToken))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "VALIDATION_ERROR",
                        message = "Refresh token is required"
                    }
                });
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var jti = User.FindFirstValue("jti") ?? User.FindFirstValue(JwtRegisteredClaimNames.Jti);
            var expValue = User.FindFirstValue("exp") ?? User.FindFirstValue(JwtRegisteredClaimNames.Exp);

            if (!string.IsNullOrWhiteSpace(jti) && long.TryParse(expValue, out var expUnix))
            {
                var accessTokenExpiresAt = DateTimeOffset.FromUnixTimeSeconds(expUnix).UtcDateTime;

                var alreadyRevoked = await _context.RevokedAccessTokens
                    .AnyAsync(x => x.Jti == jti);

                if (!alreadyRevoked)
                {
                    _context.RevokedAccessTokens.Add(new RevokedAccessToken
                    {
                        Jti = jti,
                        UserId = userId,
                        ExpiresAt = accessTokenExpiresAt,
                        RevokedAt = DateTime.UtcNow,
                        Reason = "Logout"
                    });
                }
            }

            var refreshTokenHash = _tokenService.HashToken(dto.RefreshToken.Trim());

            var refreshToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(x => x.TokenHash == refreshTokenHash && x.UserId == userId);

            if (refreshToken != null && refreshToken.RevokedAt == null)
            {
                refreshToken.RevokedAt = DateTime.UtcNow;
                refreshToken.ReasonRevoked = "Logout";
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Logged out successfully."
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