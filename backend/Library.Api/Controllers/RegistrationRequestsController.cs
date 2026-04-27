using System.Security.Claims;
using Library.Api.Data;
using Library.Api.DTOs.RegistrationRequests;
using Library.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Controllers
{
    [ApiController]
    [Route("api/registration-requests")]
    [Authorize(Roles = "Admin,Librarian")]
    public class RegistrationRequestsController : ControllerBase
    {
        private readonly LibraryDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public RegistrationRequestsController(
            LibraryDbContext context,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status = null)
        {
            var query = _context.RegistrationRequests.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) &&
                Enum.TryParse<RegistrationRequestStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(x => x.Status == parsedStatus);
            }

            var items = await query
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new RegistrationRequestItemDto
                {
                    Id = x.Id,
                    FullName = x.FullName,
                    Email = x.Email,
                    Username = x.Username,
                    Phone = x.Phone,
                    Address = x.Address,
                    Status = x.Status.ToString(),
                    CreatedAt = x.CreatedAt,
                    ReviewedAt = x.ReviewedAt,
                    ReviewedByUserId = x.ReviewedByUserId,
                    RejectReason = x.RejectReason
                })
                .ToListAsync();

            return Ok(new { items });
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPending()
        {
            var items = await _context.RegistrationRequests
                .AsNoTracking()
                .Where(x => x.Status == RegistrationRequestStatus.Pending)
                .OrderBy(x => x.CreatedAt)
                .Select(x => new RegistrationRequestItemDto
                {
                    Id = x.Id,
                    FullName = x.FullName,
                    Email = x.Email,
                    Username = x.Username,
                    Phone = x.Phone,
                    Address = x.Address,
                    Status = x.Status.ToString(),
                    CreatedAt = x.CreatedAt,
                    ReviewedAt = x.ReviewedAt,
                    ReviewedByUserId = x.ReviewedByUserId,
                    RejectReason = x.RejectReason
                })
                .ToListAsync();

            return Ok(new { items });
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _context.RegistrationRequests
                .AsNoTracking()
                .Where(x => x.Id == id)
                .Select(x => new RegistrationRequestItemDto
                {
                    Id = x.Id,
                    FullName = x.FullName,
                    Email = x.Email,
                    Username = x.Username,
                    Phone = x.Phone,
                    Address = x.Address,
                    Status = x.Status.ToString(),
                    CreatedAt = x.CreatedAt,
                    ReviewedAt = x.ReviewedAt,
                    ReviewedByUserId = x.ReviewedByUserId,
                    RejectReason = x.RejectReason
                })
                .FirstOrDefaultAsync();

            if (item == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "REGISTRATION_REQUEST_NOT_FOUND",
                        message = "Registration request not found"
                    }
                });
            }

            return Ok(item);
        }

        [HttpPost("{id:int}/approve")]
        public async Task<IActionResult> Approve(int id)
        {
            var request = await _context.RegistrationRequests
                .FirstOrDefaultAsync(x => x.Id == id);

            if (request == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "REGISTRATION_REQUEST_NOT_FOUND",
                        message = "Registration request not found"
                    }
                });
            }

            if (request.Status != RegistrationRequestStatus.Pending)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "INVALID_REQUEST_STATUS",
                        message = "Only pending requests can be approved"
                    }
                });
            }

            var existingUserByName = await _userManager.FindByNameAsync(request.Username);
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

            var existingUserByEmail = await _userManager.FindByEmailAsync(request.Email);
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

            if (!await _roleManager.RoleExistsAsync("User"))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "ROLE_NOT_FOUND",
                        message = "User role not found"
                    }
                });
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var user = new ApplicationUser
            {
                UserName = request.Username,
                Email = request.Email,
                EmailConfirmed = true,
                SecurityStamp = Guid.NewGuid().ToString()
            };

            user.PasswordHash = request.PasswordHash;

            var createUserResult = await _userManager.CreateAsync(user);

            if (!createUserResult.Succeeded)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "USER_CREATE_FAILED",
                        message = "User could not be created",
                        details = createUserResult.Errors.Select(x => new
                        {
                            code = x.Code,
                            message = x.Description
                        })
                    }
                });
            }

            var addRoleResult = await _userManager.AddToRoleAsync(user, "User");

            if (!addRoleResult.Succeeded)
            {
                await transaction.RollbackAsync();

                return BadRequest(new
                {
                    error = new
                    {
                        code = "USER_ROLE_ASSIGN_FAILED",
                        message = "User was created but role assignment failed",
                        details = addRoleResult.Errors.Select(x => new
                        {
                            code = x.Code,
                            message = x.Description
                        })
                    }
                });
            }

            var member = new Member
            {
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                Address = request.Address,
                UserId = user.Id
            };

            _context.Members.Add(member);

            request.Status = RegistrationRequestStatus.Approved;
            request.ReviewedAt = DateTime.UtcNow;
            request.ReviewedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            request.RejectReason = null;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                message = "Registration request approved successfully.",
                userId = user.Id,
                memberId = member.Id,
                status = request.Status.ToString()
            });
        }

        [HttpPost("{id:int}/reject")]
        public async Task<IActionResult> Reject(int id, [FromBody] RejectRegistrationRequestDto dto)
        {
            var request = await _context.RegistrationRequests
                .FirstOrDefaultAsync(x => x.Id == id);

            if (request == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "REGISTRATION_REQUEST_NOT_FOUND",
                        message = "Registration request not found"
                    }
                });
            }

            if (request.Status != RegistrationRequestStatus.Pending)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "INVALID_REQUEST_STATUS",
                        message = "Only pending requests can be rejected"
                    }
                });
            }

            request.Status = RegistrationRequestStatus.Rejected;
            request.ReviewedAt = DateTime.UtcNow;
            request.ReviewedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            request.RejectReason = string.IsNullOrWhiteSpace(dto.Reason) ? null : dto.Reason.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Registration request rejected successfully.",
                status = request.Status.ToString()
            });
        }
    }
}