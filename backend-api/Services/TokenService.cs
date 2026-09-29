using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using SmartSolar.Api.Models;

namespace SmartSolar.Api.Services;

public sealed class TokenService
{
    private readonly byte[] _secret;
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(8);

    public TokenService(IConfiguration configuration)
    {
        var configuredSecret = configuration["Auth:Secret"] ?? Environment.GetEnvironmentVariable("AUTH_SECRET");
        if (string.IsNullOrWhiteSpace(configuredSecret) || configuredSecret.Length < 32)
            throw new InvalidOperationException("Auth:Secret or AUTH_SECRET must contain at least 32 characters.");
        _secret = Encoding.UTF8.GetBytes(configuredSecret);
    }

    public string CreateToken(AppUser user)
    {
        var payload = new TokenPayload(user.Username, user.Role.ToString(), user.ProsumerNic, DateTimeOffset.UtcNow.Add(TokenLifetime).ToUnixTimeSeconds());
        var payloadBytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload));
        var encodedPayload = Base64UrlEncode(payloadBytes);
        var signature = Sign(encodedPayload);
        return $"{encodedPayload}.{signature}";
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        var parts = token.Split('.', 2);
        if (parts.Length != 2)
            return null;

        var expectedSignature = Sign(parts[0]);
        var suppliedSignature = Base64UrlDecode(parts[1]);
        var expectedBytes = Base64UrlDecode(expectedSignature);
        if (suppliedSignature is null || expectedBytes is null || !CryptographicOperations.FixedTimeEquals(suppliedSignature, expectedBytes))
            return null;

        try
        {
            var payloadBytes = Base64UrlDecode(parts[0]);
            if (payloadBytes is null) return null;
            var payload = JsonSerializer.Deserialize<TokenPayload>(payloadBytes);
            if (payload is null || payload.ExpiresAt < DateTimeOffset.UtcNow.ToUnixTimeSeconds())
                return null;
            if (!Enum.TryParse<UserRole>(payload.Role, true, out var role))
                return null;

            var claims = new List<Claim>
            {
                new(ClaimTypes.Name, payload.Username),
                new(ClaimTypes.Role, role.ToString())
            };
            if (!string.IsNullOrWhiteSpace(payload.ProsumerNic))
                claims.Add(new Claim("prosumer_nic", payload.ProsumerNic));
            return new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private string Sign(string value) => Base64UrlEncode(new HMACSHA256(_secret).ComputeHash(Encoding.UTF8.GetBytes(value)));

    private static string Base64UrlEncode(byte[] value) => Convert.ToBase64String(value).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[]? Base64UrlDecode(string value)
    {
        try
        {
            var padded = value.Replace('-', '+').Replace('_', '/') + new string('=', (4 - value.Length % 4) % 4);
            return Convert.FromBase64String(padded);
        }
        catch (FormatException)
        {
            return null;
        }
    }

    private sealed record TokenPayload(string Username, string Role, string? ProsumerNic, long ExpiresAt);
}
