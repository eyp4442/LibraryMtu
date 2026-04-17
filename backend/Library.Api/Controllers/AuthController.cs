using System.Security.Claims;
using Library.Api.DTOs.Auth;
using Library.Api.Interfaces;
using Library.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Library.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _configuration;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            ITokenService tokenService,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _configuration = configuration;
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