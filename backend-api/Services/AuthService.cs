/*
 * File: AuthService.cs
 * Handles password hashing and login validation.
 */
using System.Security.Cryptography;
using System.Text;
using SmartSolar.Api.Models;

namespace SmartSolar.Api.Services;

public class AuthService
{
    private readonly UserService _users;
    private readonly ProsumerService _prosumers;
    // Store the user and prosumer services used during authentication.
    public AuthService(UserService users, ProsumerService prosumers)
    {
        _users = users;
        _prosumers = prosumers;
    }

    // Hash the supplied password before storage or comparison.
    public string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }

    // Validate the supplied login details and return the matched active user.
    public async Task<ApiResult<AppUser>> LoginAsync(string username, string password)
    {
        var login = username.Trim();
        var user = await _users.GetByUsernameAsync(login);
        if (user is null && login.Contains('@'))
        {
            var prosumer = (await _prosumers.GetAllAsync()).FirstOrDefault(x => string.Equals(x.Email, login, StringComparison.OrdinalIgnoreCase));
            if (prosumer is not null) user = await _users.GetByUsernameAsync(prosumer.Nic);
        }
        if (user is null || user.PasswordHash != HashPassword(password))
            return new(false, "Invalid username or password.", null);
        if (user.Status != AccountStatus.Active)
            return new(false, "Account is not active.", null);
        return new(true, "Login successful.", user);
    }
}
