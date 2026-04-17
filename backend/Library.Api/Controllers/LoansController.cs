using Library.Api.Data;
using Library.Api.DTOs.Loans;
using Library.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Librarian")]
    public class LoansController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public LoansController(LibraryDbContext context)
        {
            _context = context;
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutLoanDto dto)
        {
            if (dto.MemberId <= 0 || dto.CopyId <= 0)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "VALIDATION_ERROR",
                        message = "Validation failed",
                        details = new object?[]
                        {
                            dto.MemberId <= 0 ? new { field = "memberId", message = "Must be greater than 0" } : null,
                            dto.CopyId <= 0 ? new { field = "copyId", message = "Must be greater than 0" } : null
                        }.Where(x => x != null)
                    }
                });
            }

            var member = await _context.Members.FirstOrDefaultAsync(x => x.Id == dto.MemberId);
            if (member == null)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "MEMBER_NOT_FOUND",
                        message = "Member not found"
                    }
                });
            }

            var copy = await _context.BookCopies.FirstOrDefaultAsync(x => x.Id == dto.CopyId);
            if (copy == null)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "BOOK_COPY_NOT_FOUND",
                        message = "Book copy not found"
                    }
                });
            }

            if (copy.Status != BookCopyStatus.Available)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "BOOK_COPY_NOT_AVAILABLE",
                        message = "Book copy is not available"
                    }
                });
            }

            var loan = new Loan
            {
                MemberId = dto.MemberId,
                CopyId = dto.CopyId,
                LoanDate = DateTime.UtcNow,
                DueDate = dto.DueDate,
                Status = LoanStatus.Active,
                RenewCount = 0,
                ReturnRequestedAt = null
            };

            copy.Status = BookCopyStatus.Loaned;

            _context.Loans.Add(loan);
            await _context.SaveChangesAsync();

            return Created($"/api/loans/{loan.Id}", MapLoan(loan));
        }

        [HttpGet("pending-return")]
        public async Task<IActionResult> GetPendingReturn()
        {
            var items = await _context.Loans
                .AsNoTracking()
                .Where(x => x.Status == LoanStatus.ReturnPendingApproval)
                .OrderBy(x => x.ReturnRequestedAt)
                .Select(x => new LoanItemDto
                {
                    Id = x.Id,
                    MemberId = x.MemberId,
                    CopyId = x.CopyId,
                    LoanDate = x.LoanDate,
                    DueDate = x.DueDate,
                    ReturnDate = x.ReturnDate,
                    Status = x.Status.ToString(),
                    RenewCount = x.RenewCount,
                    ReturnRequestedAt = x.ReturnRequestedAt
                })
                .ToListAsync();

            return Ok(new { items });
        }

        [HttpPost("{id:int}/approve-return")]
        public async Task<IActionResult> ApproveReturn(int id)
        {
            var loan = await _context.Loans
                .Include(x => x.Copy)
                .FirstOrDefaultAsync(x => x.Id == id);

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

            if (loan.Status != LoanStatus.ReturnPendingApproval)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "INVALID_LOAN_STATUS",
                        message = "Loan must be in ReturnPendingApproval status"
                    }
                });
            }

            loan.Status = LoanStatus.Returned;
            loan.ReturnDate = DateTime.UtcNow;
            loan.Copy.Status = BookCopyStatus.Available;

            await _context.SaveChangesAsync();

            return Ok(MapLoan(loan));
        }

        [HttpPost("{id:int}/reject-return")]
        public async Task<IActionResult> RejectReturn(int id, [FromBody] RejectReturnDto dto)
        {
            var loan = await _context.Loans
                .Include(x => x.Copy)
                .FirstOrDefaultAsync(x => x.Id == id);

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

            if (loan.Status != LoanStatus.ReturnPendingApproval)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "INVALID_LOAN_STATUS",
                        message = "Loan must be in ReturnPendingApproval status"
                    }
                });
            }

            loan.Status = LoanStatus.Active;
            loan.ReturnRequestedAt = null;
            loan.Copy.Status = BookCopyStatus.Loaned;

            await _context.SaveChangesAsync();

            return Ok(MapLoan(loan));
        }

        [HttpPost("{id:int}/renew")]
        public async Task<IActionResult> Renew(int id)
        {
            var loan = await _context.Loans
                .Include(x => x.Copy)
                .FirstOrDefaultAsync(x => x.Id == id);

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

            loan.DueDate = loan.DueDate.AddDays(14);
            loan.RenewCount += 1;

            await _context.SaveChangesAsync();

            return Ok(MapLoan(loan));
        }

        [HttpPost("return")]
        public async Task<IActionResult> Return([FromBody] ReturnLoanDto dto)
        {
            var loan = await _context.Loans
                .Include(x => x.Copy)
                .FirstOrDefaultAsync(x => x.Id == dto.LoanId);

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

            if (loan.Status == LoanStatus.Returned)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "LOAN_ALREADY_RETURNED",
                        message = "Loan is already returned"
                    }
                });
            }

            loan.Status = LoanStatus.Returned;
            loan.ReturnDate = DateTime.UtcNow;
            loan.ReturnRequestedAt = null;
            loan.Copy.Status = BookCopyStatus.Available;

            await _context.SaveChangesAsync();

            return Ok(MapLoan(loan));
        }

        [HttpGet("overdue")]
        public async Task<IActionResult> GetOverdue()
        {
            var now = DateTime.UtcNow;

            var items = await _context.Loans
                .AsNoTracking()
                .Where(x => x.ReturnDate == null && x.DueDate < now)
                .OrderBy(x => x.DueDate)
                .Select(x => new LoanItemDto
                {
                    Id = x.Id,
                    MemberId = x.MemberId,
                    CopyId = x.CopyId,
                    LoanDate = x.LoanDate,
                    DueDate = x.DueDate,
                    ReturnDate = x.ReturnDate,
                    Status = "Overdue",
                    RenewCount = x.RenewCount,
                    ReturnRequestedAt = x.ReturnRequestedAt
                })
                .ToListAsync();

            return Ok(new { items });
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