/*
 * File: AuthenticationMiddleware.cs
 * Reads bearer tokens from requests and attaches authenticated users to the HTTP context.
 */
namespace SmartSolar.Api.Services;

public sealed class AuthenticationMiddleware
{
    private readonly RequestDelegate _next;

    // Store the next middleware delegate for the request pipeline.
    public AuthenticationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    // Authenticate the bearer token before passing the request to the next middleware.
    public async Task InvokeAsync(HttpContext context, TokenService tokens)
    {
        var header = context.Request.Headers.Authorization.FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(header) && header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            var principal = tokens.ValidateToken(header[7..].Trim());
            if (principal is not null)
                context.User = principal;
        }

        await _next(context);
    }
}
