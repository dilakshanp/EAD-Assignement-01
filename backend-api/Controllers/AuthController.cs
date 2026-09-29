/*
 * SE4040 Enterprise Application Development - Assignment 1
 * Smart Solar Microgrid Trading System
 * AI-assisted implementation; review and explain before submission.
 */
using Microsoft.AspNetCore.Mvc;
using SmartSolar.Api.Models;
using SmartSolar.Api.Services;

namespace SmartSolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly UserService _users;
    private readonly TokenService _tokens;
    public AuthController(AuthService auth, UserService users, TokenService tokens)
    {
        _auth = auth;
        _users = users;
        _tokens = tokens;
    }

    // Authenticates a user and returns role information for client routing.
    [HttpPost("login")]
    public async Task<ActionResult<ApiResult<LoginResponse>>> Login(LoginRequest request)
    {
        var result = await _auth.LoginAsync(request.Username, request.Password);
        if (!result.Success || result.Data is null)
            return Unauthorized(new ApiResult<LoginResponse>(false, result.Message, null));
        return Ok(new ApiResult<LoginResponse>(true, result.Message, new LoginResponse(_tokens.CreateToken(result.Data), result.Data)));
    }

    // Creates a web or operator user account.
    [HttpPost("users")]
    public async Task<ActionResult<ApiResult<AppUser>>> CreateUser(CreateUserRequest request)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice))
            return StatusCode(StatusCodes.Status403Forbidden, new ApiResult<AppUser>(false, "Only Backoffice users can create web users.", null));
        if (request.Role == UserRole.Prosumer)
            return BadRequest(new ApiResult<AppUser>(false, "Prosumers must register through the prosumer endpoint.", null));
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            return BadRequest(new ApiResult<AppUser>(false, "Username and a password of at least 8 characters are required.", null));
        if (await _users.GetByUsernameAsync(request.Username.Trim()) is not null)
            return Conflict(new ApiResult<AppUser>(false, "Username already exists.", null));

        var user = new AppUser
        {
            Username = request.Username.Trim(),
            PasswordHash = _auth.HashPassword(request.Password),
            Role = request.Role,
            ProsumerNic = request.ProsumerNic
        };
        await _users.CreateAsync(user);
        return Ok(new ApiResult<AppUser>(true, "User created.", user));
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<AppUser>>> Users()
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice))
            return StatusCode(StatusCodes.Status403Forbidden, new ApiResult<bool>(false, "Only Backoffice users can view web users.", false));
        return await _users.GetAllAsync();
    }

    [HttpPut("users/{id}")]
    public async Task<ActionResult<ApiResult<AppUser>>> UpdateUser(string id, UpdateUserRequest request)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice))
            return StatusCode(StatusCodes.Status403Forbidden, new ApiResult<AppUser>(false, "Only Backoffice users can update web users.", null));
        if (request.Role == UserRole.Prosumer)
            return BadRequest(new ApiResult<AppUser>(false, "Prosumers must register through the prosumer endpoint.", null));
        if (string.IsNullOrWhiteSpace(request.Username))
            return BadRequest(new ApiResult<AppUser>(false, "Username is required.", null));
        if (!string.IsNullOrWhiteSpace(request.Password) && request.Password.Length < 8)
            return BadRequest(new ApiResult<AppUser>(false, "Password must contain at least 8 characters.", null));

        var user = await _users.GetByIdAsync(id);
        if (user is null)
            return NotFound(new ApiResult<AppUser>(false, "User was not found.", null));

        var username = request.Username.Trim();
        if (await _users.UsernameExistsAsync(username, id))
            return Conflict(new ApiResult<AppUser>(false, "Username already exists.", null));

        user.Username = username;
        user.Role = request.Role;
        user.ProsumerNic = request.ProsumerNic;
        if (!string.IsNullOrWhiteSpace(request.Password))
            user.PasswordHash = _auth.HashPassword(request.Password);

        await _users.UpdateAsync(user);
        return Ok(new ApiResult<AppUser>(true, "User updated.", user));
    }

    [HttpPost("users/{id}/activate")]
    public async Task<ActionResult<ApiResult<bool>>> ActivateUser(string id)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice))
            return StatusCode(StatusCodes.Status403Forbidden, new ApiResult<bool>(false, "Only Backoffice users can activate web users.", false));
        var user = await _users.GetByIdAsync(id);
        if (user is null) return NotFound(new ApiResult<bool>(false, "User was not found.", false));
        await _users.UpdateStatusAsync(id, AccountStatus.Active);
        return Ok(new ApiResult<bool>(true, "User activated.", true));
    }

    [HttpPost("users/{id}/deactivate")]
    public async Task<ActionResult<ApiResult<bool>>> DeactivateUser(string id)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice))
            return StatusCode(StatusCodes.Status403Forbidden, new ApiResult<bool>(false, "Only Backoffice users can deactivate web users.", false));
        var user = await _users.GetByIdAsync(id);
        if (user is null) return NotFound(new ApiResult<bool>(false, "User was not found.", false));
        await _users.UpdateStatusAsync(id, AccountStatus.Deactivated);
        return Ok(new ApiResult<bool>(true, "User deactivated.", true));
    }

    [HttpDelete("users/{id}")]
    public async Task<ActionResult<ApiResult<bool>>> DeleteUser(string id)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice))
            return StatusCode(StatusCodes.Status403Forbidden, new ApiResult<bool>(false, "Only Backoffice users can delete web users.", false));
        var result = await _users.DeleteAsync(id);
        if (result.DeletedCount == 0)
            return NotFound(new ApiResult<bool>(false, "User was not found.", false));
        return Ok(new ApiResult<bool>(true, "User deleted.", true));
    }
}

public record LoginRequest(string Username, string Password);
public record CreateUserRequest(string Username, string Password, UserRole Role, string? ProsumerNic);
public record UpdateUserRequest(string Username, string? Password, UserRole Role, string? ProsumerNic);
public record LoginResponse(string Token, AppUser User);
