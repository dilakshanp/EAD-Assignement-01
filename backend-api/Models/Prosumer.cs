/*
 * File: Prosumer.cs
 * Defines the prosumer profile document stored in MongoDB.
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
