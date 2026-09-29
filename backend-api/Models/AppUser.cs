/*
 * File: AppUser.cs
 * Defines the application user document stored in MongoDB.
 */
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace SmartSolar.Api.Models;

public class AppUser
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string Username { get; set; } = "";
    [JsonIgnore]
    public string PasswordHash { get; set; } = "";
    public UserRole Role { get; set; }
    public AccountStatus Status { get; set; } = AccountStatus.Active;
    public string? ProsumerNic { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
