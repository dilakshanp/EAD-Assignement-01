/*
 * SE4040 Enterprise Application Development - Assignment 1
 * Smart Solar Microgrid Trading System
 * AI-assisted implementation; review and explain before submission.
 */
using MongoDB.Driver;
using SmartSolar.Api.Models;

namespace SmartSolar.Api.Services;

public class ProsumerService
{
    private readonly MongoContext _db;
    public ProsumerService(MongoContext db) => _db = db;

    public Task<List<Prosumer>> GetAllAsync() => _db.Prosumers.Find(_ => true).ToListAsync();
    public Task<Prosumer?> GetAsync(string nic) => _db.Prosumers.Find(x => x.Nic == nic).FirstOrDefaultAsync();
    public Task UpsertAsync(Prosumer prosumer) => _db.Prosumers.ReplaceOneAsync(x => x.Nic == prosumer.Nic, prosumer, new ReplaceOptions { IsUpsert = true });
    public Task SetStatusAsync(string nic, AccountStatus status) =>
        _db.Prosumers.UpdateOneAsync(x => x.Nic == nic, Builders<Prosumer>.Update.Set(x => x.Status, status));
}
