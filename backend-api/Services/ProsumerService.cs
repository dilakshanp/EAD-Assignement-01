/*
 * File: ProsumerService.cs
 * Provides data access operations for prosumer profiles.
 */
using MongoDB.Driver;
using SmartSolar.Api.Models;

namespace SmartSolar.Api.Services;

public class ProsumerService
{
    private readonly MongoContext _db;
    // Store the MongoDB context used for prosumer operations.
    public ProsumerService(MongoContext db)
    {
        _db = db;
    }

    // Load all records from the related MongoDB collection.
    public Task<List<Prosumer>> GetAllAsync()
    {
        return _db.Prosumers.Find(_ => true).ToListAsync();
    }
    // Load one record by its identifier.
    public async Task<Prosumer?> GetAsync(string nic)
    {
        return await _db.Prosumers.Find(x => x.Nic == nic).FirstOrDefaultAsync();
    }
    // Create or update a prosumer profile by NIC.
    public Task UpsertAsync(Prosumer prosumer)
    {
        return _db.Prosumers.ReplaceOneAsync(x => x.Nic == prosumer.Nic, prosumer, new ReplaceOptions { IsUpsert = true });
    }
    // Update the lifecycle status of a prosumer account.
    public Task SetStatusAsync(string nic, AccountStatus status)
    {
        return _db.Prosumers.UpdateOneAsync(x => x.Nic == nic, Builders<Prosumer>.Update.Set(x => x.Status, status));
    }
}
