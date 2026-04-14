using Library.Api.Data;
using Library.Api.DTOs.Reservations;
using Library.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationsController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public ReservationsController(LibraryDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateReservationDto dto)
        {
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

            var bookExists = await _context.Books.AnyAsync(x => x.Id == dto.BookId);
            if (!bookExists)
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

            var reservation = new Reservation
            {
                MemberId = dto.MemberId,
                BookId = dto.BookId,
                ReservedAt = DateTime.UtcNow,
                Status = ReservationStatus.Active
            };

            _context.Reservations.Add(reservation);
            await _context.SaveChangesAsync();

            var response = new ReservationItemDto
            {
                Id = reservation.Id,
                MemberId = reservation.MemberId,
                BookId = reservation.BookId,
                ReservedAt = reservation.ReservedAt,
                Status = reservation.Status.ToString()
            };

            return CreatedAtAction(nameof(GetByMemberId), new { memberId = reservation.MemberId }, response);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var reservation = await _context.Reservations.FirstOrDefaultAsync(x => x.Id == id);

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

            _context.Reservations.Remove(reservation);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("/api/members/{memberId:int}/reservations")]
        public async Task<IActionResult> GetByMemberId(int memberId)
        {
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

            var items = await _context.Reservations
                .AsNoTracking()
                .Where(x => x.MemberId == memberId)
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
    }
}