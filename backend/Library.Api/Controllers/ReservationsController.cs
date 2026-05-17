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
    public class ReservationsController : ControllerBase
    {
        private static readonly int[] AllowedHoldMinutes = { 1, 2, 60, 720, 1440 };

        private readonly LibraryDbContext _context;

        public ReservationsController(LibraryDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateReservationDto dto)
        {
            await ExpireOldReservationsAsync();

            if (dto.MemberId <= 0 || dto.BookId <= 0)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "VALIDATION_ERROR",
                        message = "Validation failed",
                        details = new object[]
                        {
                            dto.MemberId <= 0 ? new { field = "memberId", message = "Must be greater than 0" } : null!,
                            dto.BookId <= 0 ? new { field = "bookId", message = "Must be greater than 0" } : null!
                        }.Where(x => x != null)
                    }
                });
            }

            if (!AllowedHoldMinutes.Contains(dto.HoldMinutes))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "INVALID_RESERVATION_DURATION",
                        message = "Reservation duration must be one of: 1, 2, 60, 720, 1440 minutes"
                    }
                });
            }

            var memberExists = await _context.Members.AnyAsync(x => x.Id == dto.MemberId);

            if (!memberExists)
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

            var book = await _context.Books
                .Include(x => x.Copies)
                .FirstOrDefaultAsync(x => x.Id == dto.BookId);

            if (book == null)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "BOOK_NOT_FOUND",
                        message = "Book not found"
                    }
                });
            }

            if (!book.Copies.Any())
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "BOOK_HAS_NO_COPIES",
                        message = "This book has no physical copies and cannot be reserved"
                    }
                });
            }

            var alreadyReserved = await _context.Reservations.AnyAsync(x =>
                x.MemberId == dto.MemberId &&
                x.BookId == dto.BookId &&
                x.Status == ReservationStatus.Active);

            if (alreadyReserved)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "RESERVATION_ALREADY_EXISTS",
                        message = "Active reservation already exists for this member and book"
                    }
                });
            }

            var availableCopy = book.Copies
                .OrderBy(x => x.Id)
                .FirstOrDefault(x => x.Status == BookCopyStatus.Available);

            if (availableCopy == null)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "BOOK_COPY_NOT_AVAILABLE",
                        message = "There is no available physical copy to reserve"
                    }
                });
            }

            var now = DateTime.UtcNow;

            var reservation = new Reservation
            {
                MemberId = dto.MemberId,
                BookId = dto.BookId,
                CopyId = availableCopy.Id,
                ReservedAt = now,
                ExpiresAt = now.AddMinutes(dto.HoldMinutes),
                Status = ReservationStatus.Active
            };

            availableCopy.Status = BookCopyStatus.Reserved;

            _context.Reservations.Add(reservation);
            await _context.SaveChangesAsync();

            var createdReservation = await _context.Reservations
                .AsNoTracking()
                .Include(x => x.Member)
                .Include(x => x.Book)
                .Include(x => x.Copy)
                .FirstAsync(x => x.Id == reservation.Id);

            return CreatedAtAction(
                nameof(GetByMemberId),
                new { memberId = reservation.MemberId },
                MapReservation(createdReservation));
        }

        [HttpGet("pending")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> GetPending()
        {
            await ExpireOldReservationsAsync();

            var reservations = await _context.Reservations
                .AsNoTracking()
                .Include(x => x.Member)
                .Include(x => x.Book)
                .Include(x => x.Copy)
                .Where(x => x.Status == ReservationStatus.Active)
                .OrderBy(x => x.ExpiresAt)
                .ToListAsync();

            var items = reservations.Select(MapReservation).ToList();

            return Ok(new { items });
        }

        [HttpPost("{id:int}/checkout")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> CheckoutReservation(int id, [FromBody] CheckoutReservationDto dto)
        {
            await ExpireOldReservationsAsync();

            if (dto.DueDate <= DateTime.UtcNow)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "INVALID_DUE_DATE",
                        message = "Due date must be in the future"
                    }
                });
            }

            var reservation = await _context.Reservations
                .Include(x => x.Copy)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (reservation == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "RESERVATION_NOT_FOUND",
                        message = "Reservation not found"
                    }
                });
            }

            if (reservation.Status != ReservationStatus.Active)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "INVALID_RESERVATION_STATUS",
                        message = "Only active reservations can be checked out"
                    }
                });
            }

            if (reservation.ExpiresAt.HasValue && reservation.ExpiresAt.Value < DateTime.UtcNow)
            {
                reservation.Status = ReservationStatus.Expired;

                if (reservation.Copy != null && reservation.Copy.Status == BookCopyStatus.Reserved)
                {
                    reservation.Copy.Status = BookCopyStatus.Available;
                }

                await _context.SaveChangesAsync();

                return BadRequest(new
                {
                    error = new
                    {
                        code = "RESERVATION_EXPIRED",
                        message = "Reservation has expired"
                    }
                });
            }

            if (reservation.CopyId == null || reservation.Copy == null)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "RESERVATION_COPY_MISSING",
                        message = "Reservation is not linked to a physical copy"
                    }
                });
            }

            if (reservation.Copy.Status != BookCopyStatus.Reserved)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "BOOK_COPY_NOT_RESERVED",
                        message = "Reserved copy is not in Reserved status"
                    }
                });
            }

            var loan = new Loan
            {
                MemberId = reservation.MemberId,
                CopyId = reservation.CopyId.Value,
                LoanDate = DateTime.UtcNow,
                DueDate = dto.DueDate,
                Status = LoanStatus.Active,
                RenewCount = 0,
                ReturnRequestedAt = null
            };

            reservation.Status = ReservationStatus.Fulfilled;
            reservation.Copy.Status = BookCopyStatus.Loaned;

            _context.Loans.Add(loan);
            await _context.SaveChangesAsync();

            return Ok(new LoanItemDto
            {
                Id = loan.Id,
                MemberId = loan.MemberId,
                CopyId = loan.CopyId,
                LoanDate = loan.LoanDate,
                DueDate = loan.DueDate,
                ReturnDate = loan.ReturnDate,
                Status = loan.Status.ToString(),
                RenewCount = loan.RenewCount,
                ReturnRequestedAt = loan.ReturnRequestedAt
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            await ExpireOldReservationsAsync();

            var reservation = await _context.Reservations
                .Include(x => x.Copy)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (reservation == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "RESERVATION_NOT_FOUND",
                        message = "Reservation not found"
                    }
                });
            }

            if (reservation.Status != ReservationStatus.Active)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "INVALID_RESERVATION_STATUS",
                        message = "Only active reservations can be cancelled"
                    }
                });
            }

            reservation.Status = ReservationStatus.Cancelled;

            if (reservation.Copy != null && reservation.Copy.Status == BookCopyStatus.Reserved)
            {
                reservation.Copy.Status = BookCopyStatus.Available;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("/api/members/{memberId:int}/reservations")]
        public async Task<IActionResult> GetByMemberId(int memberId)
        {
            await ExpireOldReservationsAsync();

            var memberExists = await _context.Members.AnyAsync(x => x.Id == memberId);

            if (!memberExists)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "MEMBER_NOT_FOUND",
                        message = "Member not found"
                    }
                });
            }

            var reservations = await _context.Reservations
                .AsNoTracking()
                .Include(x => x.Member)
                .Include(x => x.Book)
                .Include(x => x.Copy)
                .Where(x => x.MemberId == memberId)
                .OrderByDescending(x => x.ReservedAt)
                .ToListAsync();

            var items = reservations.Select(MapReservation).ToList();

            return Ok(new { items });
        }

        private async Task ExpireOldReservationsAsync()
        {
            var now = DateTime.UtcNow;

            var expiredReservations = await _context.Reservations
                .Include(x => x.Copy)
                .Where(x =>
                    x.Status == ReservationStatus.Active &&
                    x.ExpiresAt != null &&
                    x.ExpiresAt < now)
                .ToListAsync();

            if (expiredReservations.Count == 0)
                return;

            foreach (var reservation in expiredReservations)
            {
                reservation.Status = ReservationStatus.Expired;

                if (reservation.Copy != null && reservation.Copy.Status == BookCopyStatus.Reserved)
                {
                    reservation.Copy.Status = BookCopyStatus.Available;
                }
            }

            await _context.SaveChangesAsync();
        }

        private static ReservationItemDto MapReservation(Reservation reservation)
        {
            return new ReservationItemDto
            {
                Id = reservation.Id,
                MemberId = reservation.MemberId,
                MemberFullName = reservation.Member?.FullName,
                BookId = reservation.BookId,
                BookTitle = reservation.Book?.Title,
                CopyId = reservation.CopyId,
                CopyBarcode = reservation.Copy?.Barcode,
                ReservedAt = reservation.ReservedAt,
                ExpiresAt = reservation.ExpiresAt,
                Status = reservation.Status.ToString()
            };
        }
    }
}