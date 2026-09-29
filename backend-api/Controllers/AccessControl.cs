/*
 * File: AccessControl.cs
 * Provides request-level role and prosumer ownership checks for controllers.
 */
using SmartSolar.Api.Models;

namespace SmartSolar.Api.Controllers;

public static class AccessControl
{
    // Check whether the request user has one of the allowed roles.
    public static bool HasRole(HttpRequest request, params UserRole[] roles)
    {
        return request.HttpContext.User.Identity?.IsAuthenticated == true
            && roles.Any(role => request.HttpContext.User.IsInRole(role.ToString()));
    }

    // Read the authenticated prosumer NIC claim from the request.
    public static string? ProsumerNic(HttpRequest request)
    {
        return request.HttpContext.User.FindFirst("prosumer_nic")?.Value;
    }
}
