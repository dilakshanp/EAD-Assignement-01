/*
 * SE4040 Enterprise Application Development - Assignment 1
 * Smart Solar Microgrid Trading System
 * AI-assisted implementation; review and explain before submission.
 */
using MongoDB.Driver;
using SmartSolar.Api.Models;
using System.Security.Cryptography;

namespace SmartSolar.Api.Services;

public class ReservationService
{
    private readonly MongoContext _db;
    public ReservationService(MongoContext db) => _db = db;

    public Task<List<EnergyReservation>> GetAllAsync() => _db.Reservations.Find(_ => true).ToListAsync();
    public Task<List<EnergyReservation>> GetByProsumerAsync(string nic) => _db.Reservations.Find(x => x.ProsumerNic == nic).ToListAsync();
    public async Task<EnergyReservation?> GetAsync(string id) => await _db.Reservations.Find(x => x.Id == id).FirstOrDefaultAsync();

    public async Task<ApiResult<EnergyReservation>> CreateAsync(EnergyReservation reservation, bool approveImmediately = true)
    {
        var node = await _db.Nodes.Find(x => x.Id == reservation.NodeId && x.IsActive).FirstOrDefaultAsync();
        if (node is null) return new(false, "Selected microgrid node is not active.", null);
        var validation = await ValidateBookingAsync(reservation, node, null, false);
        if (!validation.Success) return new(false, validation.Message, null);

        reservation.TransactionCode = approveImmediately ? $"SMG-{Convert.ToHexString(RandomNumberGenerator.GetBytes(24))}" : null;
        reservation.Status = approveImmediately ? ReservationStatus.Approved : ReservationStatus.Pending;
        reservation.CreatedAtUtc = DateTime.UtcNow;
        reservation.UpdatedAtUtc = reservation.CreatedAtUtc;
        await _db.Reservations.InsertOneAsync(reservation);
        return new(true, approveImmediately ? "Reservation created and approved." : "Reservation submitted for approval.", reservation);
    }

    public async Task<ApiResult<EnergyReservation>> ApproveAsync(string id)
    {
        var reservation = await GetAsync(id);
        if (reservation is null) return new(false, "Reservation not found.", null);
        if (reservation.Status != ReservationStatus.Pending)
            return new(false, "Only pending reservations can be approved.", null);
        reservation.Status = ReservationStatus.Approved;
        reservation.TransactionCode = $"SMG-{Convert.ToHexString(RandomNumberGenerator.GetBytes(24))}";
        reservation.UpdatedAtUtc = DateTime.UtcNow;
        await _db.Reservations.ReplaceOneAsync(x => x.Id == id && x.Status == ReservationStatus.Pending, reservation);
        return new(true, "Reservation approved and QR transaction issued.", reservation);
    }

    public async Task<ApiResult<EnergyReservation>> UpdateAsync(string id, EnergyReservation update, string? ownerNic = null)
    {
        var existing = await GetAsync(id);
        if (existing is null) return new(false, "Reservation not found.", null);
        if (ownerNic is not null && existing.ProsumerNic != ownerNic)
            return new(false, "You can only modify your own reservations.", null);
        if (existing.Status is not (ReservationStatus.Pending or ReservationStatus.Approved))
            return new(false, "Only open reservations can be modified.", null);
        var noticeValidation = ValidateReservationWindow(existing.SlotStartUtc, existing.SlotEndUtc, true);
        if (!noticeValidation.Success) return new(false, noticeValidation.Message, null);
        var node = await _db.Nodes.Find(x => x.Id == update.NodeId && x.IsActive).FirstOrDefaultAsync();
        if (node is null) return new(false, "Selected microgrid node is not active.", null);
        var newSlotValidation = await ValidateBookingAsync(update, node, id, false);
        if (!newSlotValidation.Success) return new(false, newSlotValidation.Message, null);

        update.Id = id;
        update.ProsumerNic = existing.ProsumerNic;
        update.TransactionCode = existing.TransactionCode;
        update.CreatedAtUtc = existing.CreatedAtUtc;
        update.Status = existing.Status;
        update.UpdatedAtUtc = DateTime.UtcNow;
        await _db.Reservations.ReplaceOneAsync(x => x.Id == id, update);
        return new(true, "Reservation updated.", update);
    }

    public async Task<ApiResult<bool>> CancelAsync(string id, string? ownerNic = null)
    {
        var existing = await GetAsync(id);
        if (existing is null) return new(false, "Reservation not found.", false);
        if (ownerNic is not null && existing.ProsumerNic != ownerNic)
            return new(false, "You can only cancel your own reservations.", false);
        if (existing.Status is not (ReservationStatus.Pending or ReservationStatus.Approved))
            return new(false, "Only open reservations can be cancelled.", false);
        var validation = ValidateReservationWindow(existing.SlotStartUtc, existing.SlotEndUtc, true);
        if (!validation.Success) return new(false, validation.Message, false);
        await _db.Reservations.UpdateOneAsync(x => x.Id == id, Builders<EnergyReservation>.Update.Set(x => x.Status, ReservationStatus.Cancelled));
        return new(true, "Reservation cancelled.", true);
    }

    public async Task<ApiResult<EnergyReservation>> CompleteByQrAsync(string transactionCode)
    {
        var reservation = await _db.Reservations.Find(x => x.TransactionCode == transactionCode).FirstOrDefaultAsync();
        if (reservation is null) return new(false, "QR transaction was not found on the server.", null);
        if (reservation.Status != ReservationStatus.Approved) return new(false, "Reservation is not approved or already closed.", null);
        var now = DateTime.UtcNow;
        if (now > reservation.SlotEndUtc) return new(false, "This reservation slot has expired.", null);
        reservation.Status = ReservationStatus.Completed;
        reservation.UpdatedAtUtc = now;
        var result = await _db.Reservations.ReplaceOneAsync(x => x.Id == reservation.Id && x.Status == ReservationStatus.Approved, reservation);
        if (result.ModifiedCount == 0) return new(false, "Reservation was already completed or cancelled.", null);
        return new(true, "Energy transfer finalized.", reservation);
    }

    private async Task<ApiResult<bool>> ValidateBookingAsync(EnergyReservation reservation, MicrogridNode node, string? ignoredId, bool requireNotice)
    {
        var window = ValidateReservationWindow(reservation.SlotStartUtc, reservation.SlotEndUtc, requireNotice);
        if (!window.Success) return window;
        if (reservation.EnergyKwh <= 0 || reservation.EnergyKwh > node.CapacityKwh)
            return new(false, "Energy amount must be positive and cannot exceed node capacity.", false);

        var prosumer = await _db.Prosumers.Find(x => x.Nic == reservation.ProsumerNic && x.Status == AccountStatus.Active).FirstOrDefaultAsync();
        if (prosumer is null) return new(false, "The prosumer account is not active.", false);

        var overlapping = await _db.Reservations.CountDocumentsAsync(x =>
            x.Id != ignoredId && x.NodeId == reservation.NodeId
            && (x.Status == ReservationStatus.Pending || x.Status == ReservationStatus.Approved)
            && x.SlotStartUtc < reservation.SlotEndUtc && reservation.SlotStartUtc < x.SlotEndUtc);
        if (overlapping > 0) return new(false, "The selected node already has a reservation in this time range.", false);

        var schedule = node.Schedules.FirstOrDefault(x => x.StartUtc <= reservation.SlotStartUtc && x.EndUtc >= reservation.SlotEndUtc);
        if (node.Schedules.Count > 0 && (schedule is null || schedule.AvailableSlots <= 0))
            return new(false, "The selected node has no available schedule slot.", false);
        return new(true, "Reservation is valid.", true);
    }

    private static ApiResult<bool> ValidateReservationWindow(DateTime slotStartUtc, DateTime slotEndUtc, bool requireNotice)
    {
        var now = DateTime.UtcNow;
        if (slotStartUtc == default) return new(false, "Please select a valid reservation start date.", false);
        if (slotEndUtc <= slotStartUtc) return new(false, "Reservation end must be after its start.", false);
        if (slotStartUtc > now.AddDays(7)) return new(false, "Reservations must be scheduled within 7 days.", false);
        if (slotEndUtc > now.AddDays(7)) return new(false, "Reservation must end within 7 days.", false);
        if (slotStartUtc <= now) return new(false, "Reservation slot must be in the future.", false);
        if (requireNotice && slotStartUtc < now.AddHours(12)) return new(false, "Updates and cancellations require at least 12 hours notice.", false);
        return new(true, "Valid reservation window.", true);
    }
}
