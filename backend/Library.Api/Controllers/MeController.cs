using System.Security.Claims;
using Library.Api.Data;
using Library.Api.DTOs.Loans;
using Library.Api.DTOs.Reservations;
using Library.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "User")]
    public class MeController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public MeController(LibraryDbContext context)
        {
            _context = context;
        }

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

        private async Task<Member?> GetCurrentMemberAsync()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userId))
                return null;

            return await _context.Members.FirstOrDefaultAsync(x => x.UserId == userId);
        }

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