using Library.Api.Data;
using Library.Api.DTOs.BookCopies;
using Library.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Controllers
{
    [ApiController]

    // Bu controller'da route doğrudan "api" üzerinden başlatıldı.
    // Böylece endpoint'ler /api/books/{bookId}/copies ve /api/copies/{copyId}
    // gibi daha doğal bir REST yapısına sahip oldu.
    [Route("api")]

    // Kitap kopyası yönetimi operasyonel bir görevdir.
    // Bu yüzden sadece Admin ve Librarian rollerine açıktır.
    [Authorize(Roles = "Admin,Librarian")]
    public class BookCopiesController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public BookCopiesController(LibraryDbContext context)
        {
            _context = context;
        }

        // Belirli bir kitaba ait tüm fiziksel kopyaları listeler.
        // Önce kitabın varlığı kontrol edilir; olmayan bir kitaba ait kopya listesi istenirse 404 döner.
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

            // Listeleme işlemi sadece okuma amaçlı olduğu için AsNoTracking kullanılır.
            // Bu, Entity Framework'ün gereksiz change tracking yapmasını engeller.
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

        // Belirli bir kitaba yeni fiziksel kopya ekler.
        // BookId URL'den, barkod bilgisi ise request body'den alınır.
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

            // Kopya eklenmeden önce ilgili kitabın gerçekten var olup olmadığı kontrol edilir.
            // Böylece var olmayan bir kitaba fiziksel kopya bağlanması engellenir.
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

            // Barkod fiziksel kopyayı benzersiz şekilde temsil eder.
            // Aynı barkodun birden fazla kopyada kullanılması veri tutarsızlığına yol açacağı için engellenir.
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

            // Yeni eklenen kopya başlangıçta kullanılabilir kabul edilir.
            // Daha sonra checkout, return request veya maintenance gibi işlemlerle status değişebilir.
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

        // Belirli bir fiziksel kitap kopyasını siler.
        // Kopyanın geçmiş loan kaydı varsa silme işlemi engellenir.
        [HttpDelete("copies/{copyId:int}")]
        public async Task<IActionResult> Delete(int copyId)
        {
            // Loan ilişkisi de çekilir çünkü silme kararında geçmiş ödünç kayıtları kontrol edilir.
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

            // Bir kopya daha önce ödünç verilmişse silinmez.
            // Bu kural geçmiş loan kayıtlarının tutarlılığını korumak için uygulanır.
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