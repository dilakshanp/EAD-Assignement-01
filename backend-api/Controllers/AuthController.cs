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
    public AuthController(AuthService auth, UserService users)
    {
        _auth = auth;
        _users = users;
    }

    // Authenticates a user and returns role information for client routing.
    [HttpPost("login")]
    public async Task<ActionResult<ApiResult<AppUser>>> Login(LoginRequest request) =>
        Ok(await _auth.LoginAsync(request.Username, request.Password));

    // Creates a web or operator user account.
    [HttpPost("users")]
    public async Task<ActionResult<ApiResult<AppUser>>> CreateUser(CreateUserRequest request)
    {
        var user = new AppUser
        {
            Username = request.Username,
            PasswordHash = _auth.HashPassword(request.Password),
            Role = request.Role,
            ProsumerNic = request.ProsumerNic
        };
        await _users.CreateAsync(user);
        return Ok(new ApiResult<AppUser>(true, "User created.", user));
    }

    [HttpGet("users")]
    public async Task<List<AppUser>> Users() => await _users.GetAllAsync();
}

public record LoginRequest(string Username, string Password);
public record CreateUserRequest(string Username, string Password, UserRole Role, string? ProsumerNic);
