/*
 * SE4040 Enterprise Application Development - Assignment 1
 * Smart Solar Microgrid Trading System
 * AI-assisted implementation; review and explain before submission.
 */
namespace SmartSolar.Api.Services;

public static class EnvLoader
{
    public static void Load()
    {
        var path = Path.Combine(Directory.GetCurrentDirectory(), ".env");
        if (!File.Exists(path)) return;

        foreach (var line in File.ReadAllLines(path))
        {
            var trimmed = line.Trim();
            if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith("#")) continue;

            var separatorIndex = trimmed.IndexOf('=');
            if (separatorIndex <= 0) continue;

            var key = trimmed[..separatorIndex].Trim();
            var value = trimmed[(separatorIndex + 1)..].Trim().Trim('"').Trim('\'');

            Environment.SetEnvironmentVariable(key, value);
        }

        var uri = Environment.GetEnvironmentVariable("MONGODB_URI");
        if (!string.IsNullOrWhiteSpace(uri))
            Environment.SetEnvironmentVariable("MongoDb__ConnectionString", uri);

        var database = Environment.GetEnvironmentVariable("MONGODB_DATABASE");
        if (!string.IsNullOrWhiteSpace(database))
            Environment.SetEnvironmentVariable("MongoDb__DatabaseName", database);
    }
}
