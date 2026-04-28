using Library.Api.Data;
using Library.Api.DTOs.Members;
using Library.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Library.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Librarian")]
    public class MembersController : ControllerBase
    {
        private readonly LibraryDbContext _context;

        public MembersController(LibraryDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _context.Members
                .AsNoTracking()
                .OrderBy(x => x.FullName)
                .Select(x => new MemberListItemDto
                {
                    Id = x.Id,
                    FullName = x.FullName,
                    Email = x.Email,
                    Phone = x.Phone,
                    Address = x.Address
                })
                .ToListAsync();

            return Ok(new { items });
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var member = await _context.Members
                .AsNoTracking()
                .Where(x => x.Id == id)
                .Select(x => new MemberDetailDto
                {
                    Id = x.Id,
                    FullName = x.FullName,
                    Email = x.Email,
                    Phone = x.Phone,
                    Address = x.Address
                })
                .FirstOrDefaultAsync();

            if (member == null)
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

            return Ok(member);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateMemberDto dto)
        {
            var validationError = ValidateMemberDto(dto.FullName, dto.Email, dto.Phone, dto.Address);
            if (validationError != null)
                return validationError;

            var normalizedEmail = dto.Email.Trim().ToLower();

            var exists = await _context.Members
                .AnyAsync(x => x.Email.ToLower() == normalizedEmail);

            if (exists)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "MEMBER_EMAIL_ALREADY_EXISTS",
                        message = "A member with the same email already exists"
                    }
                });
            }

            var member = new Member
            {
                FullName = dto.FullName.Trim(),
                Email = dto.Email.Trim(),
                Phone = dto.Phone.Trim(),
                Address = dto.Address.Trim()
            };

            _context.Members.Add(member);
            await _context.SaveChangesAsync();

            var response = new MemberDetailDto
            {
                Id = member.Id,
                FullName = member.FullName,
                Email = member.Email,
                Phone = member.Phone,
                Address = member.Address
            };

            return CreatedAtAction(nameof(GetById), new { id = member.Id }, response);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateMemberDto dto)
        {
            var validationError = ValidateMemberDto(dto.FullName, dto.Email, dto.Phone, dto.Address);
            if (validationError != null)
                return validationError;

            var member = await _context.Members.FirstOrDefaultAsync(x => x.Id == id);
            if (member == null)
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

            var normalizedEmail = dto.Email.Trim().ToLower();

            var exists = await _context.Members
                .AnyAsync(x => x.Id != id && x.Email.ToLower() == normalizedEmail);

            if (exists)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "MEMBER_EMAIL_ALREADY_EXISTS",
                        message = "Another member with the same email already exists"
                    }
                });
            }

            member.FullName = dto.FullName.Trim();
            member.Email = dto.Email.Trim();
            member.Phone = dto.Phone.Trim();
            member.Address = dto.Address.Trim();

            await _context.SaveChangesAsync();

            var response = new MemberDetailDto
            {
                Id = member.Id,
                FullName = member.FullName,
                Email = member.Email,
                Phone = member.Phone,
                Address = member.Address
            };

            return Ok(response);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var member = await _context.Members
                .Include(x => x.Loans)
                .Include(x => x.Reservations)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (member == null)
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

            if (member.Loans.Any())
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "MEMBER_HAS_LOANS",
                        message = "Member cannot be deleted because it has related loan records"
                    }
                });
            }

            if (member.Reservations.Any())
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "MEMBER_HAS_RESERVATIONS",
                        message = "Member cannot be deleted because it has related reservations"
                    }
                });
            }

            _context.Members.Remove(member);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private IActionResult? ValidateMemberDto(string fullName, string email, string phone, string address)
        {
            var details = new List<object>();

            if (string.IsNullOrWhiteSpace(fullName))
                details.Add(new { field = "fullName", message = "Required" });

            if (string.IsNullOrWhiteSpace(email))
                details.Add(new { field = "email", message = "Required" });

            if (string.IsNullOrWhiteSpace(phone))
                details.Add(new { field = "phone", message = "Required" });

            if (string.IsNullOrWhiteSpace(address))
                details.Add(new { field = "address", message = "Required" });

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