/*
 * SE4040 Enterprise Application Development - Assignment 1
 * Smart Solar Microgrid Trading System
 * AI-assisted implementation; review and explain before submission.
 */
using System.Security.Cryptography;
using System.Text;
using SmartSolar.Api.Models;

namespace SmartSolar.Api.Services;

public class AuthService
{
    private readonly UserService _users;
    public AuthService(UserService users) => _users = users;

    public string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }

    public async Task<ApiResult<AppUser>> LoginAsync(string username, string password)
    {
        var user = await _users.GetByUsernameAsync(username);
        if (user is null || user.PasswordHash != HashPassword(password))
            return new(false, "Invalid username or password.", null);
        if (user.Status != AccountStatus.Active)
            return new(false, "Account is not active.", null);
        return new(true, "Login successful.", user);
    }
}
