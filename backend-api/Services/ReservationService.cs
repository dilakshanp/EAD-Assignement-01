/*
 * SE4040 Enterprise Application Development - Assignment 1
 * Smart Solar Microgrid Trading System
 * AI-assisted implementation; review and explain before submission.
 */
using MongoDB.Driver;
using SmartSolar.Api.Models;

namespace SmartSolar.Api.Services;

public class ReservationService
{
    private readonly MongoContext _db;
    public ReservationService(MongoContext db) => _db = db;

    public Task<List<EnergyReservation>> GetAllAsync() => _db.Reservations.Find(_ => true).ToListAsync();
    public Task<List<EnergyReservation>> GetByProsumerAsync(string nic) => _db.Reservations.Find(x => x.ProsumerNic == nic).ToListAsync();
    public Task<EnergyReservation?> GetAsync(string id) => _db.Reservations.Find(x => x.Id == id).FirstOrDefaultAsync();

    public async Task<ApiResult<EnergyReservation>> CreateAsync(EnergyReservation reservation)
    {
        var validation = ValidateReservationWindow(reservation.SlotStartUtc, false);
        if (!validation.Success) return new(false, validation.Message, null);

        var node = await _db.Nodes.Find(x => x.Id == reservation.NodeId && x.IsActive).FirstOrDefaultAsync();
        if (node is null) return new(false, "Selected microgrid node is not active.", null);

        reservation.TransactionCode = $"SMG-{Guid.NewGuid():N}";
        reservation.Status = ReservationStatus.Approved;
        await _db.Reservations.InsertOneAsync(reservation);
        return new(true, "Reservation created.", reservation);
    }

    public async Task<ApiResult<EnergyReservation>> UpdateAsync(string id, EnergyReservation update)
    {
        var existing = await GetAsync(id);
        if (existing is null) return new(false, "Reservation not found.", null);
        var validation = ValidateReservationWindow(existing.SlotStartUtc, true);
        if (!validation.Success) return new(false, validation.Message, null);

        update.Id = id;
        update.TransactionCode = existing.TransactionCode;
        update.UpdatedAtUtc = DateTime.UtcNow;
        await _db.Reservations.ReplaceOneAsync(x => x.Id == id, update);
        return new(true, "Reservation updated.", update);
    }

    public async Task<ApiResult<bool>> CancelAsync(string id)
    {
        var existing = await GetAsync(id);
        if (existing is null) return new(false, "Reservation not found.", false);
        var validation = ValidateReservationWindow(existing.SlotStartUtc, true);
        if (!validation.Success) return new(false, validation.Message, false);
        await _db.Reservations.UpdateOneAsync(x => x.Id == id, Builders<EnergyReservation>.Update.Set(x => x.Status, ReservationStatus.Cancelled));
        return new(true, "Reservation cancelled.", true);
    }

    public async Task<ApiResult<EnergyReservation>> CompleteByQrAsync(string transactionCode)
    {
        var reservation = await _db.Reservations.Find(x => x.TransactionCode == transactionCode).FirstOrDefaultAsync();
        if (reservation is null) return new(false, "QR transaction was not found on the server.", null);
        if (reservation.Status != ReservationStatus.Approved) return new(false, "Reservation is not approved or already closed.", null);
        reservation.Status = ReservationStatus.Completed;
        reservation.UpdatedAtUtc = DateTime.UtcNow;
        await _db.Reservations.ReplaceOneAsync(x => x.Id == reservation.Id, reservation);
        return new(true, "Energy transfer finalized.", reservation);
    }

    private static ApiResult<bool> ValidateReservationWindow(DateTime slotStartUtc, bool requireNotice)
    {
        var now = DateTime.UtcNow;
        if (slotStartUtc > now.AddDays(7)) return new(false, "Reservations must be scheduled within 7 days.", false);
        if (slotStartUtc <= now) return new(false, "Reservation slot must be in the future.", false);
        if (requireNotice && slotStartUtc < now.AddHours(12)) return new(false, "Updates and cancellations require at least 12 hours notice.", false);
        return new(true, "Valid reservation window.", true);
    }
}
