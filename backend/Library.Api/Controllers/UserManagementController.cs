using Library.Api.DTOs.Users;
using Library.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Library.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UserManagementController : ControllerBase
    {
        private static readonly string[] AllowedRoles = { "Admin", "Librarian", "User" };

        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public UserManagementController(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = _userManager.Users.ToList();
            var items = new List<UserListItemDto>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);

                items.Add(new UserListItemDto
                {
                    Id = user.Id,
                    Username = user.UserName ?? string.Empty,
                    Role = roles.FirstOrDefault() ?? string.Empty
                });
            }

            return Ok(new { items });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
        {
            var validationError = ValidateCreateUserDto(dto);
            if (validationError != null)
                return validationError;

            var username = dto.Username.Trim();
            var role = dto.Role.Trim();

            var existingUser = await _userManager.FindByNameAsync(username);
            if (existingUser != null)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "USER_ALREADY_EXISTS",
                        message = "A user with the same username already exists"
                    }
                });
            }

            if (!await _roleManager.RoleExistsAsync(role))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "ROLE_NOT_FOUND",
                        message = "Role not found"
                    }
                });
            }

            var user = new ApplicationUser
            {
                UserName = username,
                Email = $"{username}@library.local",
                EmailConfirmed = true
            };

            var createResult = await _userManager.CreateAsync(user, dto.Password);

            if (!createResult.Succeeded)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "USER_CREATE_FAILED",
                        message = "User could not be created",
                        details = createResult.Errors.Select(x => new
                        {
                            code = x.Code,
                            message = x.Description
                        })
                    }
                });
            }

            var roleResult = await _userManager.AddToRoleAsync(user, role);

            if (!roleResult.Succeeded)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "USER_ROLE_ASSIGN_FAILED",
                        message = "User was created but role assignment failed",
                        details = roleResult.Errors.Select(x => new
                        {
                            code = x.Code,
                            message = x.Description
                        })
                    }
                });
            }

            var response = new UserListItemDto
            {
                Id = user.Id,
                Username = user.UserName ?? string.Empty,
                Role = role
            };

            return CreatedAtAction(nameof(GetAll), new { id = user.Id }, response);
        }

        [HttpPut("{id}/role")]
        public async Task<IActionResult> UpdateRole(string id, [FromBody] UpdateUserRoleDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Role))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "VALIDATION_ERROR",
                        message = "Role is required",
                        details = new[]
                        {
                            new { field = "role", message = "Required" }
                        }
                    }
                });
            }

            var newRole = dto.Role.Trim();

            if (!AllowedRoles.Contains(newRole))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "INVALID_ROLE",
                        message = "Role must be one of: Admin, Librarian, User"
                    }
                });
            }

            var user = await _userManager.FindByIdAsync(id);

            if (user == null)
            {
                return NotFound(new
                {
                    error = new
                    {
                        code = "USER_NOT_FOUND",
                        message = "User not found"
                    }
                });
            }

            if (!await _roleManager.RoleExistsAsync(newRole))
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "ROLE_NOT_FOUND",
                        message = "Role not found"
                    }
                });
            }

            var currentRoles = await _userManager.GetRolesAsync(user);

            if (currentRoles.Any())
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);

                if (!removeResult.Succeeded)
                {
                    return BadRequest(new
                    {
                        error = new
                        {
                            code = "USER_ROLE_REMOVE_FAILED",
                            message = "Existing roles could not be removed",
                            details = removeResult.Errors.Select(x => new
                            {
                                code = x.Code,
                                message = x.Description
                            })
                        }
                    });
                }
            }

            var addResult = await _userManager.AddToRoleAsync(user, newRole);

            if (!addResult.Succeeded)
            {
                return BadRequest(new
                {
                    error = new
                    {
                        code = "USER_ROLE_ASSIGN_FAILED",
                        message = "New role could not be assigned",
                        details = addResult.Errors.Select(x => new
                        {
                            code = x.Code,
                            message = x.Description
                        })
                    }
                });
            }

            var response = new UserListItemDto
            {
                Id = user.Id,
                Username = user.UserName ?? string.Empty,
                Role = newRole
            };

            return Ok(response);
        }

        private IActionResult? ValidateCreateUserDto(CreateUserDto dto)
        {
            var details = new List<object>();

            if (string.IsNullOrWhiteSpace(dto.Username))
                details.Add(new { field = "username", message = "Required" });

            if (string.IsNullOrWhiteSpace(dto.Password))
                details.Add(new { field = "password", message = "Required" });

            if (string.IsNullOrWhiteSpace(dto.Role))
                details.Add(new { field = "role", message = "Required" });

            if (!string.IsNullOrWhiteSpace(dto.Role) && !AllowedRoles.Contains(dto.Role.Trim()))
            {
                details.Add(new { field = "role", message = "Must be one of: Admin, Librarian, User" });
            }

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