/*
 * SE4040 Enterprise Application Development - Assignment 1
 * Smart Solar Microgrid Trading System
 * AI-assisted implementation; review and explain before submission.
 */
namespace SmartSolar.Api.Settings;

public class MongoDbSettings
{
    public string ConnectionString { get; set; } = "mongodb://localhost:27017";
    public string DatabaseName { get; set; } = "smart_solar_microgrid_trading_system";
}
