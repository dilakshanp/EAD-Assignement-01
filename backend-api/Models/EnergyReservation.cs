/*
 * SE4040 Enterprise Application Development - Assignment 1
 * Smart Solar Microgrid Trading System
 * AI-assisted implementation; review and explain before submission.
 */
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolar.Api.Models;

public class EnergyReservation
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string ProsumerNic { get; set; } = "";
    public string NodeId { get; set; } = "";
    public DateTime SlotStartUtc { get; set; }
    public DateTime SlotEndUtc { get; set; }
    public double EnergyKwh { get; set; }
    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;
    public string? TransactionCode { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
