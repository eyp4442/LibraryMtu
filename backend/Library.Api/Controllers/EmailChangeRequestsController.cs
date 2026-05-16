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

    // E-posta değişikliği talepleri kullanıcı tarafından oluşturulur,
    // fakat onaylama/reddetme işlemleri yalnızca Admin ve Librarian rollerine açıktır.
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

        // Tüm e-posta değişiklik taleplerini listeler.
        // İsteğe bağlı status parametresi ile Pending, Approved veya Rejected durumlarına göre filtreleme yapılabilir.
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status = null)
        {
            var query = _context.EmailChangeRequests
                .AsNoTracking()
                .AsQueryable();

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

        // Sadece onay bekleyen e-posta değişiklik taleplerini listeler.
        // Görevli panelinde bekleyen işler ekranı için kullanışlıdır.
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

        // Bekleyen bir e-posta değişikliği talebini onaylar.
        // Onay sırasında hem ApplicationUser.Email hem de Member.Email güncellenir.
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

            // Aynı e-posta başka aktif kullanıcıda varsa onay verilmez.
            // Bu kural identity tarafında hesap karışıklığını engeller.
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

            // Identity kullanıcısı UserManager üzerinden güncellenir.
            // Böylece Identity'nin kendi validasyon ve güncelleme mekanizması korunur.
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

            // Kütüphane üyelik kaydı da Identity kullanıcısı ile senkron tutulur.
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

        // Bekleyen bir e-posta değişikliği talebini reddeder.
        // Reddetme sebebi opsiyonel olarak saklanır.
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