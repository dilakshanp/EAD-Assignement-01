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
    public async Task<MicrogridNode?> GetAsync(string id) => await _db.Nodes.Find(x => x.Id == id).FirstOrDefaultAsync();

    public ApiResult<bool> Validate(MicrogridNode node)
    {
        if (string.IsNullOrWhiteSpace(node.Name)) return new(false, "Node name is required.", false);
        if (node.Latitude is < -90 or > 90 || node.Longitude is < -180 or > 180)
            return new(false, "Node coordinates are invalid.", false);
        if (node.CapacityKwh <= 0) return new(false, "Node capacity must be greater than zero.", false);
        if (node.BatteryStorageSlots < 0) return new(false, "Battery slots cannot be negative.", false);
        if (node.Schedules.Any(schedule => schedule.EndUtc <= schedule.StartUtc || schedule.AvailableSlots < 0))
            return new(false, "Node schedules must have a valid range and non-negative availability.", false);
        return new(true, "Node is valid.", true);
    }

    public Task CreateAsync(MicrogridNode node) => _db.Nodes.InsertOneAsync(node);
    public Task UpdateAsync(string id, MicrogridNode node) => _db.Nodes.ReplaceOneAsync(x => x.Id == id, node);

    public async Task<ApiResult<MicrogridNode>> UpdateBatterySlotsAsync(string id, int batteryStorageSlots)
    {
        if (batteryStorageSlots < 0) return new(false, "Battery slots cannot be negative.", null);
        var result = await _db.Nodes.UpdateOneAsync(x => x.Id == id, Builders<MicrogridNode>.Update.Set(x => x.BatteryStorageSlots, batteryStorageSlots));
        if (result.MatchedCount == 0) return new(false, "Microgrid node was not found.", null);
        var node = await GetAsync(id);
        return new(true, "Battery slot availability updated.", node);
    }

    public async Task<ApiResult<bool>> DeactivateAsync(string id)
    {
        var node = await GetAsync(id);
        if (node is null) return new(false, "Microgrid node was not found.", false);
        var activeReservations = await _db.Reservations.CountDocumentsAsync(x =>
            x.NodeId == id && (x.Status == ReservationStatus.Pending || x.Status == ReservationStatus.Approved));
        if (activeReservations > 0)
            return new(false, "Node cannot be deactivated while active reservations exist.", false);
        await _db.Nodes.UpdateOneAsync(x => x.Id == id, Builders<MicrogridNode>.Update.Set(x => x.IsActive, false));
        return new(true, "Node deactivated.", true);
    }

    public async Task<ApiResult<bool>> ActivateAsync(string id)
    {
        var node = await GetAsync(id);
        if (node is null) return new(false, "Microgrid node was not found.", false);
        await _db.Nodes.UpdateOneAsync(x => x.Id == id, Builders<MicrogridNode>.Update.Set(x => x.IsActive, true));
        return new(true, "Node reactivated.", true);
    }
}
