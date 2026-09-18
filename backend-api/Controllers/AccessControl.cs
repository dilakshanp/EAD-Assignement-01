/*
 * SE4040 Enterprise Application Development - Assignment 1
 * Smart Solar Microgrid Trading System
 * AI-assisted implementation; review and explain before submission.
 */
using SmartSolar.Api.Models;

namespace SmartSolar.Api.Controllers;

public static class AccessControl
{
    public static bool HasRole(HttpRequest request, params UserRole[] roles)
    {
        var value = request.Headers["X-User-Role"].FirstOrDefault();
        return Enum.TryParse<UserRole>(value, true, out var role) && roles.Contains(role);
    }
}
