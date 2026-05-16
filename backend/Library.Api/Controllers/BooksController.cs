using Library.Api.Data;
using Library.Api.DTOs.Books;
using Library.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    // Controller genel olarak Admin ve Librarian rollerine kapalıdır.
    // Sadece okuma endpoint'leri AllowAnonymous ile herkese açılmıştır.
    [Authorize(Roles = "Admin,Librarian")]
    public class BooksController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public BooksController(LibraryDbContext context)
        {
            _context = context;
        }

        // Kitapları listeler.
        // Ziyaretçiler dahil herkes kitap listesini, filtreleme ve sayfalama ile görüntüleyebilir.
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? query,
            [FromQuery] string? title,
            [FromQuery] string? author,
            [FromQuery] string? publisher,
            [FromQuery] int? publishedYear,
            [FromQuery] string? isbn,
            [FromQuery] int? categoryId,
            [FromQuery] string? language,
            [FromQuery] bool? availableOnly,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? sortBy = "title",
            [FromQuery] string? sortDirection = "asc")
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0) pageSize = 20;

            // Listeleme sadece okuma amaçlıdır.
            // Category ve Copies bilgileri stok ve kategori response'u için dahil edilir.
            var booksQuery = _context.Books
                .AsNoTracking()
                .Include(x => x.Category)
                .Include(x => x.Copies)
                .AsQueryable();

            // Genel arama alanı; title, author, ISBN ve publisher üzerinde arama yapar.
            if (!string.IsNullOrWhiteSpace(query))
            {
                var q = query.Trim().ToLower();
                booksQuery = booksQuery.Where(x =>
                    x.Title.ToLower().Contains(q) ||
                    x.Author.ToLower().Contains(q) ||
                    x.Isbn.ToLower().Contains(q) ||
                    x.Publisher.ToLower().Contains(q));
            }

            if (!string.IsNullOrWhiteSpace(title))
            {
                var value = title.Trim().ToLower();
                booksQuery = booksQuery.Where(x => x.Title.ToLower().Contains(value));
            }

            if (!string.IsNullOrWhiteSpace(author))
            {
                var value = author.Trim().ToLower();
                booksQuery = booksQuery.Where(x => x.Author.ToLower().Contains(value));
            }

            if (!string.IsNullOrWhiteSpace(publisher))
            {
                var value = publisher.Trim().ToLower();
                booksQuery = booksQuery.Where(x => x.Publisher.ToLower().Contains(value));
            }

            if (publishedYear.HasValue)
            {
                booksQuery = booksQuery.Where(x => x.PublishedYear == publishedYear.Value);
            }

            if (!string.IsNullOrWhiteSpace(isbn))
            {
                var value = isbn.Trim().ToLower();
                booksQuery = booksQuery.Where(x => x.Isbn.ToLower().Contains(value));
            }

            if (categoryId.HasValue)
            {
                booksQuery = booksQuery.Where(x => x.CategoryId == categoryId.Value);
            }

            if (!string.IsNullOrWhiteSpace(language))
            {
                var value = language.Trim().ToLower();
                booksQuery = booksQuery.Where(x => x.Language.ToLower().Contains(value));
            }

            // Sadece en az bir müsait fiziksel kopyası olan kitapları listeler.
            if (availableOnly == true)
            {
                booksQuery = booksQuery.Where(x => x.Copies.Any(c => c.Status == BookCopyStatus.Available));
            }

            var isDescending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);

            // Kullanıcı title, author veya publishedYear alanına göre sıralama yapabilir.
            booksQuery = (sortBy ?? "title").ToLower() switch
            {
                "publishedyear" => isDescending
                    ? booksQuery.OrderByDescending(x => x.PublishedYear)
                    : booksQuery.OrderBy(x => x.PublishedYear),

                "author" => isDescending
                    ? booksQuery.OrderByDescending(x => x.Author)
                    : booksQuery.OrderBy(x => x.Author),

                _ => isDescending
                    ? booksQuery.OrderByDescending(x => x.Title)
                    : booksQuery.OrderBy(x => x.Title)
            };

            var total = await booksQuery.CountAsync();

            // Sayfalama uygulanır ve Book entity'leri frontend'e DTO olarak döndürülür.
            var items = await booksQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new BookListItemDto
                {
                    Id = x.Id,
                    Title = x.Title,
                    Author = x.Author,
                    Isbn = x.Isbn,
                    PublishedYear = x.PublishedYear,
                    Publisher = x.Publisher,
                    Language = x.Language,
                    PageCount = x.PageCount,
                    Description = x.Description,
                    CoverImageUrl = x.CoverImageUrl,
                    CategoryId = x.CategoryId,
                    CategoryName = x.Category.Name,
                    AvailableCopyCount = x.Copies.Count(c => c.Status == BookCopyStatus.Available),
                    TotalCopyCount = x.Copies.Count(),
                    StockSummary = new StockSummaryDto
                    {
                        Total = x.Copies.Count(),
                        Available = x.Copies.Count(c => c.Status == BookCopyStatus.Available),
                        Loaned = x.Copies.Count(c => c.Status == BookCopyStatus.Loaned),
                        Reserved = x.Copies.Count(c => c.Status == BookCopyStatus.Reserved),
                        PendingReturnApproval = x.Copies.Count(c => c.Status == BookCopyStatus.PendingReturnApproval)
                    }
                })
                .ToListAsync();

            return Ok(new
            {
                items,
                page,
                pageSize,
                total
            });
        }

        // Tek bir kitabın detay bilgisini döndürür.
        // Kitap detayında kategori ve stok özeti de yer alır.
        [AllowAnonymous]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var book = await _context.Books
                .AsNoTracking()
                .Include(x => x.Category)
                .Include(x => x.Copies)
                .Where(x => x.Id == id)
                .Select(x => new BookDetailDto
                {
                    Id = x.Id,
                    Title = x.Title,
                    Author = x.Author,
                    Isbn = x.Isbn,
                    PublishedYear = x.PublishedYear,
                    Publisher = x.Publisher,
                    Language = x.Language,
                    PageCount = x.PageCount,
                    Description = x.Description,
                    CoverImageUrl = x.CoverImageUrl,
                    CategoryId = x.CategoryId,
                    CategoryName = x.Category.Name,
                    AvailableCopyCount = x.Copies.Count(c => c.Status == BookCopyStatus.Available),
                    TotalCopyCount = x.Copies.Count(),
                    StockSummary = new StockSummaryDto
                    {
                        Total = x.Copies.Count(),
                        Available = x.Copies.Count(c => c.Status == BookCopyStatus.Available),
                        Loaned = x.Copies.Count(c => c.Status == BookCopyStatus.Loaned),
                        Reserved = x.Copies.Count(c => c.Status == BookCopyStatus.Reserved),
                        PendingReturnApproval = x.Copies.Count(c => c.Status == BookCopyStatus.PendingReturnApproval)
                    }
                })
                .FirstOrDefaultAsync();

            if (book == null)
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

            return Ok(book);
        }

        // Yeni kitap kaydı oluşturur.
        // Kitap oluşturma işlemi sadece Admin ve Librarian rollerine açıktır.
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateBookDto dto)
        {
            var validationError = ValidateBookDto(
                dto.Title,
                dto.Author,
                dto.Isbn,
                dto.PublishedYear,
                dto.Publisher,
                dto.Language,
                dto.PageCount,
                dto.CategoryId);

            if (validationError != null)
                return validationError;

            var normalizedIsbn = dto.Isbn.Trim();

            // Kitabın geçerli bir kategoriye bağlı olması gerekir.
            var categoryExists = await _context.Categories.AnyAsync(x => x.Id == dto.CategoryId);

            if (!categoryExists)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "CATEGORY_NOT_FOUND",
                        message = "Category not found"
                    }
                });
            }

            // ISBN benzersiz kabul edilir; aynı ISBN ile ikinci kitap oluşturulamaz.
            var isbnExists = await _context.Books.AnyAsync(x => x.Isbn == normalizedIsbn);

            if (isbnExists)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "BOOK_ISBN_ALREADY_EXISTS",
                        message = "A book with the same ISBN already exists"
                    }
                });
            }

            var book = new Book
            {
                Title = dto.Title.Trim(),
                Author = dto.Author.Trim(),
                Isbn = normalizedIsbn,
                PublishedYear = dto.PublishedYear,
                Publisher = dto.Publisher.Trim(),
                Language = dto.Language.Trim(),
                PageCount = dto.PageCount,
                Description = dto.Description?.Trim() ?? string.Empty,
                CoverImageUrl = string.IsNullOrWhiteSpace(dto.CoverImageUrl) ? null : dto.CoverImageUrl.Trim(),
                CategoryId = dto.CategoryId
            };

            _context.Books.Add(book);
            await _context.SaveChangesAsync();

            var categoryName = await _context.Categories
                .Where(x => x.Id == book.CategoryId)
                .Select(x => x.Name)
                .FirstAsync();

            // Yeni oluşturulan kitabın henüz fiziksel kopyası olmadığı için stok bilgileri sıfır döner.
            var response = new BookDetailDto
            {
                Id = book.Id,
                Title = book.Title,
                Author = book.Author,
                Isbn = book.Isbn,
                PublishedYear = book.PublishedYear,
                Publisher = book.Publisher,
                Language = book.Language,
                PageCount = book.PageCount,
                Description = book.Description,
                CoverImageUrl = book.CoverImageUrl,
                CategoryId = book.CategoryId,
                CategoryName = categoryName,
                AvailableCopyCount = 0,
                TotalCopyCount = 0,
                StockSummary = new StockSummaryDto()
            };

            return CreatedAtAction(nameof(GetById), new { id = book.Id }, response);
        }

        // Mevcut kitap kaydını günceller.
        // ISBN güncellenirken başka bir kitapta aynı ISBN olup olmadığı ayrıca kontrol edilir.
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateBookDto dto)
        {
            var validationError = ValidateBookDto(
                dto.Title,
                dto.Author,
                dto.Isbn,
                dto.PublishedYear,
                dto.Publisher,
                dto.Language,
                dto.PageCount,
                dto.CategoryId);

            if (validationError != null)
                return validationError;

            var book = await _context.Books.FirstOrDefaultAsync(x => x.Id == id);

            if (book == null)
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

            var categoryExists = await _context.Categories.AnyAsync(x => x.Id == dto.CategoryId);

            if (!categoryExists)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "CATEGORY_NOT_FOUND",
                        message = "Category not found"
                    }
                });
            }

            var normalizedIsbn = dto.Isbn.Trim();

            var isbnExists = await _context.Books
                .AnyAsync(x => x.Id != id && x.Isbn == normalizedIsbn);

            if (isbnExists)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "BOOK_ISBN_ALREADY_EXISTS",
                        message = "Another book with the same ISBN already exists"
                    }
                });
            }

            book.Title = dto.Title.Trim();
            book.Author = dto.Author.Trim();
            book.Isbn = normalizedIsbn;
            book.PublishedYear = dto.PublishedYear;
            book.Publisher = dto.Publisher.Trim();
            book.Language = dto.Language.Trim();
            book.PageCount = dto.PageCount;
            book.Description = dto.Description?.Trim() ?? string.Empty;
            book.CoverImageUrl = string.IsNullOrWhiteSpace(dto.CoverImageUrl) ? null : dto.CoverImageUrl.Trim();
            book.CategoryId = dto.CategoryId;

            await _context.SaveChangesAsync();

            var categoryName = await _context.Categories
                .Where(x => x.Id == book.CategoryId)
                .Select(x => x.Name)
                .FirstAsync();

            // Güncelleme response'unda mevcut fiziksel kopyaların güncel stok özeti de döndürülür.
            var copyCounts = await _context.BookCopies
                .Where(x => x.BookId == book.Id)
                .GroupBy(x => 1)
                .Select(g => new
                {
                    Total = g.Count(),
                    Available = g.Count(x => x.Status == BookCopyStatus.Available),
                    Loaned = g.Count(x => x.Status == BookCopyStatus.Loaned),
                    Reserved = g.Count(x => x.Status == BookCopyStatus.Reserved),
                    PendingReturnApproval = g.Count(x => x.Status == BookCopyStatus.PendingReturnApproval)
                })
                .FirstOrDefaultAsync();

            var response = new BookDetailDto
            {
                Id = book.Id,
                Title = book.Title,
                Author = book.Author,
                Isbn = book.Isbn,
                PublishedYear = book.PublishedYear,
                Publisher = book.Publisher,
                Language = book.Language,
                PageCount = book.PageCount,
                Description = book.Description,
                CoverImageUrl = book.CoverImageUrl,
                CategoryId = book.CategoryId,
                CategoryName = categoryName,
                AvailableCopyCount = copyCounts?.Available ?? 0,
                TotalCopyCount = copyCounts?.Total ?? 0,
                StockSummary = new StockSummaryDto
                {
                    Total = copyCounts?.Total ?? 0,
                    Available = copyCounts?.Available ?? 0,
                    Loaned = copyCounts?.Loaned ?? 0,
                    Reserved = copyCounts?.Reserved ?? 0,
                    PendingReturnApproval = copyCounts?.PendingReturnApproval ?? 0
                }
            };

            return Ok(response);
        }

        // Kitap kaydını siler.
        // Kitaba bağlı fiziksel kopya veya rezervasyon varsa silme işlemi engellenir.
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var book = await _context.Books
                .Include(x => x.Copies)
                .Include(x => x.Reservations)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (book == null)
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

            // Fiziksel kopyası olan kitap silinmez.
            // Önce ilgili kopyaların yönetilmesi gerekir.
            if (book.Copies.Any())
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "BOOK_HAS_COPIES",
                        message = "Book cannot be deleted because it has related copies"
                    }
                });
            }

            // Rezervasyon geçmişi olan kitap silinmez.
            // Bu kural rezervasyon kayıtlarının tutarlılığını korur.
            if (book.Reservations.Any())
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "BOOK_HAS_RESERVATIONS",
                        message = "Book cannot be deleted because it has related reservations"
                    }
                });
            }

            _context.Books.Remove(book);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Create ve Update işlemlerinde ortak kullanılan temel validation metodudur.
        // Hata varsa standart error envelope formatında BadRequest döndürür.
        private IActionResult? ValidateBookDto(
            string title,
            string author,
            string isbn,
            int publishedYear,
            string publisher,
            string language,
            int pageCount,
            int categoryId)
        {
            var details = new List<object>();

            if (string.IsNullOrWhiteSpace(title))
                details.Add(new { field = "title", message = "Required" });

            if (string.IsNullOrWhiteSpace(author))
                details.Add(new { field = "author", message = "Required" });

            if (string.IsNullOrWhiteSpace(isbn))
                details.Add(new { field = "isbn", message = "Required" });

            if (publishedYear <= 0)
                details.Add(new { field = "publishedYear", message = "Must be greater than 0" });

            if (string.IsNullOrWhiteSpace(publisher))
                details.Add(new { field = "publisher", message = "Required" });

            if (string.IsNullOrWhiteSpace(language))
                details.Add(new { field = "language", message = "Required" });

            if (pageCount <= 0)
                details.Add(new { field = "pageCount", message = "Must be greater than 0" });

            if (categoryId <= 0)
                details.Add(new { field = "categoryId", message = "Must be greater than 0" });

            if (details.Count == 0)
                return null;

            return new BadRequestObjectResult(new
            {
                error = new
                {
                    code = "VALIDATION_ERROR",
                    message = "Validation failed",
                    details
                }
            });
        }
    }
}