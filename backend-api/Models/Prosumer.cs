/*
 * SE4040 Enterprise Application Development - Assignment 1
 * Smart Solar Microgrid Trading System
 * AI-assisted implementation; review and explain before submission.
 */
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolar.Api.Models;

public class Prosumer
{
    [BsonId]
    public string Nic { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public string Address { get; set; } = "";
    public double SolarCapacityKw { get; set; }
    public AccountStatus Status { get; set; } = AccountStatus.Active;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
