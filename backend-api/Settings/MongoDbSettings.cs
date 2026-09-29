/*
 * File: MongoDbSettings.cs
 * Defines MongoDB configuration values bound from application settings or environment variables.
 */
namespace SmartSolar.Api.Settings;

public class MongoDbSettings
{
    public string ConnectionString { get; set; } = "mongodb://localhost:27017";
    public string DatabaseName { get; set; } = "smart_solar_microgrid_trading_system";
}
