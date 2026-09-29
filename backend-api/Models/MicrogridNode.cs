/*
 * File: MicrogridNode.cs
 * Defines microgrid node and fixed operating schedule documents stored in MongoDB.
 */
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolar.Api.Models;

public class MicrogridNode
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string Name { get; set; } = "";
    public string LocationName { get; set; } = "";
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double CapacityKwh { get; set; }
    public int BatteryStorageSlots { get; set; }
    public bool IsActive { get; set; } = true;
    public List<NodeSchedule> Schedules { get; set; } = [];
}

public class NodeSchedule
{
    public DateTime StartUtc { get; set; }
    public DateTime EndUtc { get; set; }
    public int AvailableSlots { get; set; }
}
