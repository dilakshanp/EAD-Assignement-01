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
        return request.HttpContext.User.Identity?.IsAuthenticated == true
            && roles.Any(role => request.HttpContext.User.IsInRole(role.ToString()));
    }

    public static string? ProsumerNic(HttpRequest request) =>
        request.HttpContext.User.FindFirst("prosumer_nic")?.Value;
}
