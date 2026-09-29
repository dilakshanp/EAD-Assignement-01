/*
 * File: SeedData.cs
 * Adds default users and sample node data when the database is empty.
 */
using SmartSolar.Api.Models;

namespace SmartSolar.Api.Services;

public static class SeedData
{
    // Create baseline users and sample node data if they do not already exist.
    public static async Task EnsureAsync(IServiceProvider services)
    {
        var users = services.GetRequiredService<UserService>();
        var auth = services.GetRequiredService<AuthService>();
        var nodes = services.GetRequiredService<NodeService>();

        if (await users.GetByUsernameAsync("admin") is null)
        {
            await users.CreateAsync(new AppUser
            {
                Username = "admin",
                PasswordHash = auth.HashPassword("admin123"),
                Role = UserRole.Backoffice
            });
        }

        if (await users.GetByUsernameAsync("operator") is null)
        {
            await users.CreateAsync(new AppUser
            {
                Username = "operator",
                PasswordHash = auth.HashPassword("operator123"),
                Role = UserRole.GridOperator
            });
        }

        var existingNodes = await nodes.GetAllAsync();
        if (existingNodes.Count == 0)
        {
            await nodes.CreateAsync(new MicrogridNode
            {
                Name = "Colombo Central Solar Hub",
                LocationName = "Colombo",
                Latitude = 6.9271,
                Longitude = 79.8612,
                CapacityKwh = 250,
                BatteryStorageSlots = 12
            });
        }
    }
}
