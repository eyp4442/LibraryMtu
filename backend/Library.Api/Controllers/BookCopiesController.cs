using Library.Api.Data;
using Library.Api.DTOs.BookCopies;
using Library.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Controllers
{
    [ApiController]
    [Route("api")]
    public class BookCopiesController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public BookCopiesController(LibraryDbContext context)
        {
            _context = context;
        }

        [HttpGet("books/{bookId:int}/copies")]
        public async Task<IActionResult> GetByBookId(int bookId)
        {
            var bookExists = await _context.Books.AnyAsync(x => x.Id == bookId);
            if (!bookExists)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "BOOK_NOT_FOUND",
                        message = "Book not found"
                    }
                });
            }

            var items = await _context.BookCopies
                .AsNoTracking()
                .Where(x => x.BookId == bookId)
                .OrderBy(x => x.Id)
                .Select(x => new BookCopyItemDto
                {
                    Id = x.Id,
                    BookId = x.BookId,
                    Barcode = x.Barcode,
                    Status = x.Status.ToString()
                })
                .ToListAsync();

            return Ok(new { items });
        }

        [HttpPost("books/{bookId:int}/copies")]
        public async Task<IActionResult> Create(int bookId, [FromBody] CreateBookCopyDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Barcode))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "VALIDATION_ERROR",
                        message = "Validation failed",
                        details = new[]
                        {
                            new { field = "barcode", message = "Required" }
                        }
                    }
                });
            }

            var bookExists = await _context.Books.AnyAsync(x => x.Id == bookId);
            if (!bookExists)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "BOOK_NOT_FOUND",
                        message = "Book not found"
                    }
                });
            }

            var normalizedBarcode = dto.Barcode.Trim();

            var barcodeExists = await _context.BookCopies
                .AnyAsync(x => x.Barcode == normalizedBarcode);

            if (barcodeExists)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "BOOK_COPY_BARCODE_ALREADY_EXISTS",
                        message = "A copy with the same barcode already exists"
                    }
                });
            }

            var copy = new BookCopy
            {
                BookId = bookId,
                Barcode = normalizedBarcode,
                Status = BookCopyStatus.Available
            };

            _context.BookCopies.Add(copy);
            await _context.SaveChangesAsync();

            var response = new BookCopyItemDto
            {
                Id = copy.Id,
                BookId = copy.BookId,
                Barcode = copy.Barcode,
                Status = copy.Status.ToString()
            };

            return Created($"/api/books/{bookId}/copies", response);
        }

        [HttpDelete("copies/{copyId:int}")]
        public async Task<IActionResult> Delete(int copyId)
        {
            var copy = await _context.BookCopies
                .Include(x => x.Loans)
                .FirstOrDefaultAsync(x => x.Id == copyId);

            if (copy == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "BOOK_COPY_NOT_FOUND",
                        message = "Book copy not found"
                    }
                });
            }

            if (copy.Loans.Any())
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "BOOK_COPY_HAS_LOANS",
                        message = "Book copy cannot be deleted because it has related loan records"
                    }
                });
            }

            _context.BookCopies.Remove(copy);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}