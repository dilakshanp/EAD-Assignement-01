/*
 * SE4040 Enterprise Application Development - Assignment 1
 * Smart Solar Microgrid Trading System
 * AI-assisted implementation; review and explain before submission.
 */
using MongoDB.Driver;
using SmartSolar.Api.Models;

namespace SmartSolar.Api.Services;

public class NodeService
{
    private readonly MongoContext _db;
    public NodeService(MongoContext db) => _db = db;

    public Task<List<MicrogridNode>> GetAllAsync() => _db.Nodes.Find(_ => true).ToListAsync();
    public Task<MicrogridNode?> GetAsync(string id) => _db.Nodes.Find(x => x.Id == id).FirstOrDefaultAsync();
    public Task CreateAsync(MicrogridNode node) => _db.Nodes.InsertOneAsync(node);
    public Task UpdateAsync(string id, MicrogridNode node) => _db.Nodes.ReplaceOneAsync(x => x.Id == id, node);

    public async Task<ApiResult<bool>> DeactivateAsync(string id)
    {
        var activeReservations = await _db.Reservations.CountDocumentsAsync(x =>
            x.NodeId == id && (x.Status == ReservationStatus.Pending || x.Status == ReservationStatus.Approved));
        if (activeReservations > 0)
            return new(false, "Node cannot be deactivated while active reservations exist.", false);
        await _db.Nodes.UpdateOneAsync(x => x.Id == id, Builders<MicrogridNode>.Update.Set(x => x.IsActive, false));
        return new(true, "Node deactivated.", true);
    }
}
