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
    [Authorize(Roles = "Admin,Librarian")]
    public class BooksController : ControllerBase
    {
        private readonly LibraryDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public BooksController(LibraryDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

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

            var booksQuery = _context.Books
                .AsNoTracking()
                .Include(x => x.Category)
                .Include(x => x.BookCategories)
                    .ThenInclude(x => x.Category)
                .Include(x => x.Copies)
                .Include(x => x.Images)
                .AsQueryable();

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
                booksQuery = booksQuery.Where(x =>
                    x.CategoryId == categoryId.Value ||
                    x.BookCategories.Any(bc => bc.CategoryId == categoryId.Value));
            }

            if (!string.IsNullOrWhiteSpace(language))
            {
                var value = language.Trim().ToLower();
                booksQuery = booksQuery.Where(x => x.Language.ToLower().Contains(value));
            }

            if (availableOnly == true)
            {
                booksQuery = booksQuery.Where(x =>
                    x.Copies.Any(c => c.Status == BookCopyStatus.Available));
            }

            var isDescending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);

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

            var books = await booksQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = books.Select(MapBookListItem).ToList();

            return Ok(new
            {
                items,
                page,
                pageSize,
                total
            });
        }

        [AllowAnonymous]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var book = await _context.Books
                .AsNoTracking()
                .Include(x => x.Category)
                .Include(x => x.BookCategories)
                    .ThenInclude(x => x.Category)
                .Include(x => x.Copies)
                .Include(x => x.Images)
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

            return Ok(MapBookDetail(book));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateBookDto dto)
        {
            var categoryIds = NormalizeCategoryIds(dto.CategoryId, dto.CategoryIds);

            var validationError = ValidateBookDto(
                dto.Title,
                dto.Author,
                dto.Isbn,
                dto.PublishedYear,
                dto.Publisher,
                dto.Language,
                dto.PageCount,
                categoryIds);

            if (validationError != null)
                return validationError;

            var normalizedIsbn = dto.Isbn.Trim();

            var existingCategoryIds = await _context.Categories
                .Where(x => categoryIds.Contains(x.Id))
                .Select(x => x.Id)
                .ToListAsync();

            if (existingCategoryIds.Count != categoryIds.Count)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "CATEGORY_NOT_FOUND",
                        message = "One or more categories were not found"
                    }
                });
            }

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

            var primaryCategoryId = categoryIds.First();

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
                CoverImageUrl = string.IsNullOrWhiteSpace(dto.CoverImageUrl)
                    ? null
                    : dto.CoverImageUrl.Trim(),
                CategoryId = primaryCategoryId,
                BookCategories = categoryIds
                    .Select(categoryId => new BookCategory
                    {
                        CategoryId = categoryId
                    })
                    .ToList()
            };

            _context.Books.Add(book);
            await _context.SaveChangesAsync();

            var createdBook = await _context.Books
                .AsNoTracking()
                .Include(x => x.Category)
                .Include(x => x.BookCategories)
                    .ThenInclude(x => x.Category)
                .Include(x => x.Copies)
                .Include(x => x.Images)
                .FirstAsync(x => x.Id == book.Id);

            return CreatedAtAction(nameof(GetById), new { id = book.Id }, MapBookDetail(createdBook));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateBookDto dto)
        {
            var categoryIds = NormalizeCategoryIds(dto.CategoryId, dto.CategoryIds);

            var validationError = ValidateBookDto(
                dto.Title,
                dto.Author,
                dto.Isbn,
                dto.PublishedYear,
                dto.Publisher,
                dto.Language,
                dto.PageCount,
                categoryIds);

            if (validationError != null)
                return validationError;

            var book = await _context.Books
                .Include(x => x.BookCategories)
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

            var existingCategoryIds = await _context.Categories
                .Where(x => categoryIds.Contains(x.Id))
                .Select(x => x.Id)
                .ToListAsync();

            if (existingCategoryIds.Count != categoryIds.Count)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "CATEGORY_NOT_FOUND",
                        message = "One or more categories were not found"
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
            book.CoverImageUrl = string.IsNullOrWhiteSpace(dto.CoverImageUrl)
                ? null
                : dto.CoverImageUrl.Trim();

            book.CategoryId = categoryIds.First();

            book.BookCategories.Clear();

            foreach (var categoryId in categoryIds)
            {
                book.BookCategories.Add(new BookCategory
                {
                    BookId = book.Id,
                    CategoryId = categoryId
                });
            }

            await _context.SaveChangesAsync();

            var updatedBook = await _context.Books
                .AsNoTracking()
                .Include(x => x.Category)
                .Include(x => x.BookCategories)
                    .ThenInclude(x => x.Category)
                .Include(x => x.Copies)
                .Include(x => x.Images)
                .FirstAsync(x => x.Id == book.Id);

            return Ok(MapBookDetail(updatedBook));
        }

        [HttpPost("{id:int}/images")]
        [RequestSizeLimit(25 * 1024 * 1024)]
        public async Task<IActionResult> UploadImages(
            int id,
            [FromForm] List<IFormFile> files,
            [FromForm] bool setFirstAsCover = false)
        {
            var book = await _context.Books
                .Include(x => x.Images)
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

            if (files == null || files.Count == 0)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "NO_FILES_UPLOADED",
                        message = "At least one image file must be uploaded"
                    }
                });
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var allowedContentTypes = new[] { "image/jpeg", "image/png", "image/webp" };
            const long maxFileSize = 5 * 1024 * 1024;

            var webRootPath = _environment.WebRootPath;

            if (string.IsNullOrWhiteSpace(webRootPath))
            {
                webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            var uploadDirectory = Path.Combine(webRootPath, "uploads", "book-images");
            Directory.CreateDirectory(uploadDirectory);

            var uploadedImages = new List<BookImage>();

            for (var i = 0; i < files.Count; i++)
            {
                var file = files[i];

                if (file.Length == 0)
                    continue;

                if (file.Length > maxFileSize)
                {
                    return BadRequest(new
                    {
                        error = new
                        {
                            code = "FILE_TOO_LARGE",
                            message = "Each image file must be 5 MB or smaller"
                        }
                    });
                }

                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

                if (!allowedExtensions.Contains(extension) ||
                    !allowedContentTypes.Contains(file.ContentType.ToLowerInvariant()))
                {
                    return BadRequest(new
                    {
                        error = new
                        {
                            code = "INVALID_FILE_TYPE",
                            message = "Only jpg, jpeg, png and webp image files are allowed"
                        }
                    });
                }

                var safeFileName = $"{Guid.NewGuid():N}{extension}";
                var filePath = Path.Combine(uploadDirectory, safeFileName);

                await using (var stream = System.IO.File.Create(filePath))
                {
                    await file.CopyToAsync(stream);
                }

                var imageUrl = $"/uploads/book-images/{safeFileName}";

                var bookImage = new BookImage
                {
                    BookId = book.Id,
                    ImageUrl = imageUrl,
                    OriginalFileName = Path.GetFileName(file.FileName),
                    CreatedAt = DateTime.UtcNow
                };

                uploadedImages.Add(bookImage);

                if (i == 0 && (setFirstAsCover || string.IsNullOrWhiteSpace(book.CoverImageUrl)))
                {
                    book.CoverImageUrl = imageUrl;
                }
            }

            if (uploadedImages.Count == 0)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "NO_VALID_FILES",
                        message = "No valid image files were uploaded"
                    }
                });
            }

            _context.BookImages.AddRange(uploadedImages);
            await _context.SaveChangesAsync();

            var response = uploadedImages.Select(x => new BookImageDto
            {
                Id = x.Id,
                ImageUrl = x.ImageUrl,
                OriginalFileName = x.OriginalFileName,
                CreatedAt = x.CreatedAt
            }).ToList();

            return Ok(new
            {
                items = response,
                coverImageUrl = book.CoverImageUrl
            });
        }

        [HttpDelete("{bookId:int}/images/{imageId:int}")]
        public async Task<IActionResult> DeleteImage(int bookId, int imageId)
        {
            var book = await _context.Books
                .Include(x => x.Images)
                .FirstOrDefaultAsync(x => x.Id == bookId);

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

            var image = book.Images.FirstOrDefault(x => x.Id == imageId);

            if (image == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "BOOK_IMAGE_NOT_FOUND",
                        message = "Book image not found"
                    }
                });
            }

            var imageUrl = image.ImageUrl;

            _context.BookImages.Remove(image);

            if (book.CoverImageUrl == imageUrl)
            {
                var nextImage = book.Images
                    .Where(x => x.Id != imageId)
                    .OrderBy(x => x.Id)
                    .FirstOrDefault();

                book.CoverImageUrl = nextImage?.ImageUrl;
            }

            if (imageUrl.StartsWith("/uploads/book-images/", StringComparison.OrdinalIgnoreCase))
            {
                var webRootPath = _environment.WebRootPath;

                if (string.IsNullOrWhiteSpace(webRootPath))
                {
                    webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                }

                var relativePath = imageUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                var physicalPath = Path.Combine(webRootPath, relativePath);

                if (System.IO.File.Exists(physicalPath))
                {
                    System.IO.File.Delete(physicalPath);
                }
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

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

        private static List<int> NormalizeCategoryIds(int? categoryId, List<int>? categoryIds)
        {
            var result = new List<int>();

            if (categoryIds != null)
            {
                result.AddRange(categoryIds.Where(x => x > 0));
            }

            if (categoryId.HasValue && categoryId.Value > 0)
            {
                result.Add(categoryId.Value);
            }

            return result
                .Distinct()
                .ToList();
        }

        private IActionResult? ValidateBookDto(
            string title,
            string author,
            string isbn,
            int publishedYear,
            string publisher,
            string language,
            int pageCount,
            List<int> categoryIds)
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

            if (categoryIds.Count == 0)
                details.Add(new { field = "categoryIds", message = "At least one category is required" });

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

        private static BookListItemDto MapBookListItem(Book book)
        {
            var categoryPairs = GetCategoryPairs(book);

            return new BookListItemDto
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

                Images = book.Images
                    .OrderBy(x => x.Id)
                    .Select(x => new BookImageDto
                    {
                        Id = x.Id,
                        ImageUrl = x.ImageUrl,
                        OriginalFileName = x.OriginalFileName,
                        CreatedAt = x.CreatedAt
                    })
                    .ToList(),

                ImageUrls = book.Images
                    .OrderBy(x => x.Id)
                    .Select(x => x.ImageUrl)
                    .ToList(),

                CategoryId = categoryPairs.FirstOrDefault().Id,
                CategoryName = categoryPairs.FirstOrDefault().Name ?? string.Empty,
                CategoryIds = categoryPairs.Select(x => x.Id).ToList(),
                CategoryNames = categoryPairs.Select(x => x.Name).ToList(),

                AvailableCopyCount = book.Copies.Count(c => c.Status == BookCopyStatus.Available),
                TotalCopyCount = book.Copies.Count(),

                StockSummary = new StockSummaryDto
                {
                    Total = book.Copies.Count(),
                    Available = book.Copies.Count(c => c.Status == BookCopyStatus.Available),
                    Loaned = book.Copies.Count(c => c.Status == BookCopyStatus.Loaned),
                    Reserved = book.Copies.Count(c => c.Status == BookCopyStatus.Reserved),
                    PendingReturnApproval = book.Copies.Count(c => c.Status == BookCopyStatus.PendingReturnApproval)
                }
            };
        }

        private static BookDetailDto MapBookDetail(Book book)
        {
            var item = MapBookListItem(book);

            return new BookDetailDto
            {
                Id = item.Id,
                Title = item.Title,
                Author = item.Author,
                Isbn = item.Isbn,
                PublishedYear = item.PublishedYear,
                Publisher = item.Publisher,
                Language = item.Language,
                PageCount = item.PageCount,
                Description = item.Description,
                CoverImageUrl = item.CoverImageUrl,

                Images = item.Images,
                ImageUrls = item.ImageUrls,

                CategoryId = item.CategoryId,
                CategoryName = item.CategoryName,
                CategoryIds = item.CategoryIds,
                CategoryNames = item.CategoryNames,

                AvailableCopyCount = item.AvailableCopyCount,
                TotalCopyCount = item.TotalCopyCount,
                StockSummary = item.StockSummary
            };
        }

        private static List<(int Id, string Name)> GetCategoryPairs(Book book)
        {
            var pairs = book.BookCategories
                .Where(x => x.Category != null)
                .Select(x => (x.CategoryId, x.Category.Name))
                .Distinct()
                .ToList();

            if (pairs.Count == 0 && book.Category != null)
            {
                pairs.Add((book.CategoryId, book.Category.Name));
            }

            return pairs;
        }
    }
}