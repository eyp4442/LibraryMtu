using System.Security.Claims;
using Library.Api.Data;
using Library.Api.DTOs.EmailChangeRequests;
using Library.Api.DTOs.Loans;
using Library.Api.DTOs.Profile;
using Library.Api.DTOs.Reservations;
using Library.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    // Bu controller normal kullanıcıların kendi verilerini yönetmesi için tasarlanmıştır.
    // Kullanıcılar burada yalnızca token üzerinden kendilerine bağlı Member kaydına erişebilir.
    [Authorize(Roles = "User")]
    public class MeController : ControllerBase
    {
        private readonly LibraryDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public MeController(
            LibraryDbContext context,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // Giriş yapan kullanıcının kendi ödünç kayıtlarını listeler.
        // Member bilgisi request body'den değil, JWT token üzerinden bulunur.
        [HttpGet("loans")]
        public async Task<IActionResult> GetMyLoans()
        {
            var member = await GetCurrentMemberAsync();

            if (member == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "MEMBER_NOT_FOUND",
                        message = "Member not found for current user"
                    }
                });
            }

            var loans = await _context.Loans
                .AsNoTracking()
                .Where(x => x.MemberId == member.Id)
                .OrderByDescending(x => x.LoanDate)
                .ToListAsync();

            var items = loans
                .Select(MapLoan)
                .ToList();

            return Ok(new { items });
        }

        // Giriş yapan kullanıcının kendi rezervasyon kayıtlarını listeler.
        [HttpGet("reservations")]
        public async Task<IActionResult> GetMyReservations()
        {
            var member = await GetCurrentMemberAsync();

            if (member == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "MEMBER_NOT_FOUND",
                        message = "Member not found for current user"
                    }
                });
            }

            var items = await _context.Reservations
                .AsNoTracking()
                .Where(x => x.MemberId == member.Id)
                .OrderByDescending(x => x.ReservedAt)
                .Select(x => new ReservationItemDto
                {
                    Id = x.Id,
                    MemberId = x.MemberId,
                    BookId = x.BookId,
                    ReservedAt = x.ReservedAt,
                    Status = x.Status.ToString()
                })
                .ToListAsync();

            return Ok(new { items });
        }

        // Kullanıcının kendi profil bilgisini döndürür.
        // Response içinde hem ApplicationUser hem de Member bilgileri birleştirilir.
        [HttpGet("profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var member = await GetCurrentMemberAsync();

            if (member == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "MEMBER_NOT_FOUND",
                        message = "Member not found for current user"
                    }
                });
            }

            if (string.IsNullOrWhiteSpace(member.UserId))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "MEMBER_USER_LINK_MISSING",
                        message = "Member is not linked to a user account"
                    }
                });
            }

            var user = await _userManager.FindByIdAsync(member.UserId);

            if (user == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "USER_NOT_FOUND",
                        message = "User not found for current member"
                    }
                });
            }

            var response = new MyProfileDto
            {
                MemberId = member.Id,
                UserId = user.Id,
                Username = user.UserName ?? string.Empty,
                Email = user.Email ?? member.Email,
                FullName = member.FullName,
                Phone = member.Phone,
                Address = member.Address
            };

            return Ok(response);
        }

        // Kullanıcının kendi profilindeki temel üye bilgilerini günceller.
        // Email bu endpoint üzerinden değiştirilemez; email için ayrı onaylı talep akışı vardır.
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateMyProfileDto dto)
        {
            var details = new List<object>();

            if (string.IsNullOrWhiteSpace(dto.FullName))
                details.Add(new { field = "fullName", message = "Required" });

            if (string.IsNullOrWhiteSpace(dto.Phone))
                details.Add(new { field = "phone", message = "Required" });

            if (string.IsNullOrWhiteSpace(dto.Address))
                details.Add(new { field = "address", message = "Required" });

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

            var member = await GetCurrentMemberAsync();

            if (member == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "MEMBER_NOT_FOUND",
                        message = "Member not found for current user"
                    }
                });
            }

            member.FullName = dto.FullName.Trim();
            member.Phone = dto.Phone.Trim();
            member.Address = dto.Address.Trim();

            await _context.SaveChangesAsync();

            ApplicationUser? user = null;

            if (!string.IsNullOrWhiteSpace(member.UserId))
            {
                user = await _userManager.FindByIdAsync(member.UserId);
            }

            var response = new MyProfileDto
            {
                MemberId = member.Id,
                UserId = user?.Id ?? member.UserId ?? string.Empty,
                Username = user?.UserName ?? string.Empty,
                Email = user?.Email ?? member.Email,
                FullName = member.FullName,
                Phone = member.Phone,
                Address = member.Address
            };

            return Ok(response);
        }

        // Kullanıcının email değişikliği talebi oluşturmasını sağlar.
        // Talep doğrudan uygulanmaz; Admin/Librarian onayı bekleyen Pending kayıt oluşturulur.
        [HttpPost("email-change-request")]
        public async Task<IActionResult> CreateEmailChangeRequest([FromBody] CreateEmailChangeRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.NewEmail))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "VALIDATION_ERROR",
                        message = "Validation failed",
                        details = new[]
                        {
                            new { field = "newEmail", message = "Required" }
                        }
                    }
                });
            }

            var member = await GetCurrentMemberAsync();

            if (member == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "MEMBER_NOT_FOUND",
                        message = "Member not found for current user"
                    }
                });
            }

            if (string.IsNullOrWhiteSpace(member.UserId))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "MEMBER_USER_LINK_MISSING",
                        message = "Member is not linked to a user account"
                    }
                });
            }

            var user = await _userManager.FindByIdAsync(member.UserId);

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

            var newEmail = dto.NewEmail.Trim();
            var normalizedNewEmail = _userManager.NormalizeEmail(newEmail);
            var currentNormalizedEmail = _userManager.NormalizeEmail(user.Email ?? string.Empty);

            if (normalizedNewEmail == currentNormalizedEmail)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "EMAIL_SAME_AS_CURRENT",
                        message = "New email cannot be the same as current email"
                    }
                });
            }

            // Yeni email başka aktif kullanıcıda varsa talep oluşturulmaz.
            var existingUser = await _userManager.Users
                .FirstOrDefaultAsync(x =>
                    x.NormalizedEmail == normalizedNewEmail &&
                    x.Id != user.Id);

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

            var lowerNewEmail = newEmail.ToLower();

            // Member tablosunda da aynı email'in başka üyede kullanılıp kullanılmadığı kontrol edilir.
            var existingMember = await _context.Members
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.Id != member.Id &&
                    x.Email.ToLower() == lowerNewEmail);

            if (existingMember != null)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "EMAIL_ALREADY_EXISTS",
                        message = "Email is already used by another member"
                    }
                });
            }

            // Aynı kullanıcının aynı anda birden fazla bekleyen email değişikliği talebi oluşturması engellenir.
            var pendingForCurrentUserExists = await _context.EmailChangeRequests
                .AnyAsync(x =>
                    x.UserId == user.Id &&
                    x.Status == EmailChangeRequestStatus.Pending);

            if (pendingForCurrentUserExists)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "EMAIL_CHANGE_REQUEST_ALREADY_EXISTS",
                        message = "There is already a pending email change request"
                    }
                });
            }

            // Aynı yeni email için başka bekleyen talep varsa çakışma oluşmaması için engellenir.
            var pendingSameEmailExists = await _context.EmailChangeRequests
                .AnyAsync(x =>
                    x.NewEmail.ToLower() == lowerNewEmail &&
                    x.Status == EmailChangeRequestStatus.Pending);

            if (pendingSameEmailExists)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "EMAIL_CHANGE_REQUEST_ALREADY_EXISTS",
                        message = "There is already a pending request for this email"
                    }
                });
            }

            var request = new EmailChangeRequest
            {
                MemberId = member.Id,
                UserId = user.Id,
                CurrentEmail = user.Email ?? member.Email,
                NewEmail = newEmail,
                Status = EmailChangeRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.EmailChangeRequests.Add(request);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Email change request submitted successfully and is awaiting approval.",
                requestId = request.Id,
                status = request.Status.ToString()
            });
        }

        // Kullanıcının kendi aktif loan kaydının süresini uzatmasını sağlar.
        // İşlem yalnızca token sahibi kullanıcıya ait loan üzerinde yapılabilir.
        [HttpPost("loans/{id:int}/renew")]
        public async Task<IActionResult> RenewMyLoan(int id)
        {
            var member = await GetCurrentMemberAsync();

            if (member == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "MEMBER_NOT_FOUND",
                        message = "Member not found for current user"
                    }
                });
            }

            var loan = await _context.Loans
                .Include(x => x.Copy)
                .FirstOrDefaultAsync(x => x.Id == id && x.MemberId == member.Id);

            if (loan == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "LOAN_NOT_FOUND",
                        message = "Loan not found"
                    }
                });
            }

            if (loan.Status != LoanStatus.Active)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "INVALID_LOAN_STATUS",
                        message = "Only active loans can be renewed"
                    }
                });
            }

            if (loan.DueDate < DateTime.UtcNow)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "LOAN_IS_OVERDUE",
                        message = "Overdue loans cannot be renewed"
                    }
                });
            }

            if (loan.RenewCount >= 2)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "MAX_RENEW_LIMIT_REACHED",
                        message = "Maximum renew count reached"
                    }
                });
            }

            // Kitap için aktif rezervasyon varsa mevcut kullanıcının süre uzatması engellenir.
            // Böylece başka kullanıcıların rezervasyon hakkı korunur.
            var hasActiveReservation = await _context.Reservations.AnyAsync(x =>
                x.BookId == loan.Copy.BookId &&
                x.Status == ReservationStatus.Active);

            if (hasActiveReservation)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "LOAN_RENEW_NOT_ALLOWED",
                        message = "Loan cannot be renewed because there is an active reservation for this book"
                    }
                });
            }

            loan.DueDate = loan.DueDate.AddDays(14);
            loan.RenewCount += 1;

            await _context.SaveChangesAsync();

            return Ok(MapLoan(loan));
        }

        // Kullanıcının kendi aktif loan kaydı için iade talebi oluşturmasını sağlar.
        // Talep oluşunca görevli onayı beklenir.
        [HttpPost("loans/{id:int}/request-return")]
        public async Task<IActionResult> RequestReturn(int id, [FromBody] RequestReturnDto dto)
        {
            var member = await GetCurrentMemberAsync();

            if (member == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "MEMBER_NOT_FOUND",
                        message = "Member not found for current user"
                    }
                });
            }

            var loan = await _context.Loans
                .Include(x => x.Copy)
                .FirstOrDefaultAsync(x => x.Id == id && x.MemberId == member.Id);

            if (loan == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "LOAN_NOT_FOUND",
                        message = "Loan not found"
                    }
                });
            }

            if (loan.Status != LoanStatus.Active)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "INVALID_LOAN_STATUS",
                        message = "Only active loans can request return"
                    }
                });
            }

            loan.Status = LoanStatus.ReturnPendingApproval;
            loan.ReturnRequestedAt = DateTime.UtcNow;
            loan.Copy.Status = BookCopyStatus.PendingReturnApproval;

            await _context.SaveChangesAsync();

            return Ok(MapLoan(loan));
        }

        // JWT token içindeki user id üzerinden mevcut kullanıcıya bağlı Member kaydını bulur.
        // Bu metot sayesinde kullanıcı sadece kendi kayıtları üzerinde işlem yapabilir.
        private async Task<Member?> GetCurrentMemberAsync()
        {
            var userId =
                User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                User.FindFirstValue("nameid") ??
                User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
                return null;

            return await _context.Members
                .FirstOrDefaultAsync(x => x.UserId == userId);
        }

        // Loan entity'sini frontend'e dönecek DTO formatına çevirir.
        // Aktif loan gecikmişse response tarafında Overdue olarak gösterilir.
        private static LoanItemDto MapLoan(Loan loan)
        {
            var status = loan.Status;

            if (loan.ReturnDate == null &&
                loan.DueDate < DateTime.UtcNow &&
                loan.Status == LoanStatus.Active)
            {
                status = LoanStatus.Overdue;
            }

            return new LoanItemDto
            {
                Id = loan.Id,
                MemberId = loan.MemberId,
                CopyId = loan.CopyId,
                LoanDate = loan.LoanDate,
                DueDate = loan.DueDate,
                ReturnDate = loan.ReturnDate,
                Status = status.ToString(),
                RenewCount = loan.RenewCount,
                ReturnRequestedAt = loan.ReturnRequestedAt
            };
        }
    }
}