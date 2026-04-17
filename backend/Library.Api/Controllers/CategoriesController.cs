using Library.Api.Data;
using Library.Api.DTOs.Categories;
using Library.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Librarian")]
    public class CategoriesController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public CategoriesController(LibraryDbContext context)
        {
            _context = context;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _context.Categories
                .OrderBy(x => x.Name)
                .Select(x => new CategoryListItemDto
                {
                    Id = x.Id,
                    Name = x.Name
                })
                .ToListAsync();

            return Ok(new { items });
        }

        [AllowAnonymous]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _context.Categories
                .Where(x => x.Id == id)
                .Select(x => new CategoryDetailDto
                {
                    Id = x.Id,
                    Name = x.Name
                })
                .FirstOrDefaultAsync();

            if (category == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "CATEGORY_NOT_FOUND",
                        message = "Category not found"
                    }
                });
            }

            return Ok(category);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCategoryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "VALIDATION_ERROR",
                        message = "Category name is required",
                        details = new[]
                        {
                            new { field = "name", message = "Required" }
                        }
                    }
                });
            }

            var normalizedName = dto.Name.Trim();

            var exists = await _context.Categories
                .AnyAsync(x => x.Name == normalizedName);

            if (exists)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "CATEGORY_ALREADY_EXISTS",
                        message = "Category already exists"
                    }
                });
            }

            var category = new Category
            {
                Name = normalizedName
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            var response = new CategoryDetailDto
            {
                Id = category.Id,
                Name = category.Name
            };

            return CreatedAtAction(nameof(GetById), new { id = category.Id }, response);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "VALIDATION_ERROR",
                        message = "Category name is required",
                        details = new[]
                        {
                            new { field = "name", message = "Required" }
                        }
                    }
                });
            }

            var category = await _context.Categories.FirstOrDefaultAsync(x => x.Id == id);

            if (category == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "CATEGORY_NOT_FOUND",
                        message = "Category not found"
                    }
                });
            }

            var normalizedName = dto.Name.Trim();

            var exists = await _context.Categories
                .AnyAsync(x => x.Id != id && x.Name == normalizedName);

            if (exists)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "CATEGORY_ALREADY_EXISTS",
                        message = "Another category with the same name already exists"
                    }
                });
            }

            category.Name = normalizedName;
            await _context.SaveChangesAsync();

            var response = new CategoryDetailDto
            {
                Id = category.Id,
                Name = category.Name
            };

            return Ok(response);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var category = await _context.Categories
                .Include(x => x.Books)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (category == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "CATEGORY_NOT_FOUND",
                        message = "Category not found"
                    }
                });
            }

            if (category.Books.Any())
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "CATEGORY_HAS_BOOKS",
                        message = "Category cannot be deleted because it has related books"
                    }
                });
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}