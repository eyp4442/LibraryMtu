using System.Security.Claims;
using Library.Api.Data;
using Library.Api.DTOs.EmailChangeRequests;
using Library.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Controllers
{
    [ApiController]
    [Route("api/email-change-requests")]
    [Authorize(Roles = "Admin,Librarian")]
    public class EmailChangeRequestsController : ControllerBase
    {
        private readonly LibraryDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public EmailChangeRequestsController(
            LibraryDbContext context,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status = null)
        {
            var query = _context.EmailChangeRequests.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) &&
                Enum.TryParse<EmailChangeRequestStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(x => x.Status == parsedStatus);
            }

            var items = await query
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new EmailChangeRequestItemDto
                {
                    Id = x.Id,
                    MemberId = x.MemberId,
                    UserId = x.UserId,
                    CurrentEmail = x.CurrentEmail,
                    NewEmail = x.NewEmail,
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
            var items = await _context.EmailChangeRequests
                .AsNoTracking()
                .Where(x => x.Status == EmailChangeRequestStatus.Pending)
                .OrderBy(x => x.CreatedAt)
                .Select(x => new EmailChangeRequestItemDto
                {
                    Id = x.Id,
                    MemberId = x.MemberId,
                    UserId = x.UserId,
                    CurrentEmail = x.CurrentEmail,
                    NewEmail = x.NewEmail,
                    Status = x.Status.ToString(),
                    CreatedAt = x.CreatedAt,
                    ReviewedAt = x.ReviewedAt,
                    ReviewedByUserId = x.ReviewedByUserId,
                    RejectReason = x.RejectReason
                })
                .ToListAsync();

            return Ok(new { items });
        }

        [HttpPost("{id:int}/approve")]
        public async Task<IActionResult> Approve(int id)
        {
            var request = await _context.EmailChangeRequests
                .Include(x => x.Member)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (request == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "EMAIL_CHANGE_REQUEST_NOT_FOUND",
                        message = "Email change request not found"
                    }
                });
            }

            if (request.Status != EmailChangeRequestStatus.Pending)
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

            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "USER_NOT_FOUND",
                        message = "User not found"
                    }
                });
            }

            var normalizedNewEmail = _userManager.NormalizeEmail(request.NewEmail);

            var existingUser = await _userManager.Users
                .FirstOrDefaultAsync(x => x.NormalizedEmail == normalizedNewEmail && x.Id != user.Id);

            if (existingUser != null)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "EMAIL_ALREADY_EXISTS",
                        message = "Email is already used by another active user"
                    }
                });
            }

            user.Email = request.NewEmail;
            user.NormalizedEmail = normalizedNewEmail;

            var updateUserResult = await _userManager.UpdateAsync(user);
            if (!updateUserResult.Succeeded)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "USER_EMAIL_UPDATE_FAILED",
                        message = "User email could not be updated",
                        details = updateUserResult.Errors.Select(x => new
                        {
                            code = x.Code,
                            message = x.Description
                        })
                    }
                });
            }

            request.Member.Email = request.NewEmail;

            request.Status = EmailChangeRequestStatus.Approved;
            request.ReviewedAt = DateTime.UtcNow;
            request.ReviewedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            request.RejectReason = null;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Email change request approved successfully.",
                status = request.Status.ToString(),
                newEmail = request.NewEmail
            });
        }

        [HttpPost("{id:int}/reject")]
        public async Task<IActionResult> Reject(int id, [FromBody] RejectEmailChangeRequestDto dto)
        {
            var request = await _context.EmailChangeRequests
                .FirstOrDefaultAsync(x => x.Id == id);

            if (request == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "EMAIL_CHANGE_REQUEST_NOT_FOUND",
                        message = "Email change request not found"
                    }
                });
            }

            if (request.Status != EmailChangeRequestStatus.Pending)
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

            request.Status = EmailChangeRequestStatus.Rejected;
            request.ReviewedAt = DateTime.UtcNow;
            request.ReviewedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            request.RejectReason = string.IsNullOrWhiteSpace(dto.Reason) ? null : dto.Reason.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Email change request rejected successfully.",
                status = request.Status.ToString()
            });
        }
    }
}