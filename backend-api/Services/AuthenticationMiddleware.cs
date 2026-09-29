namespace SmartSolar.Api.Services;

public sealed class AuthenticationMiddleware
{
    private readonly RequestDelegate _next;

    public AuthenticationMiddleware(RequestDelegate next) => _next = next;

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
