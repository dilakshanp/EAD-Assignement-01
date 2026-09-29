/*
 * File: ReservationService.cs
 * Contains business rules for reservation slots, QR completion, and booking validation.
 */
using MongoDB.Driver;
using SmartSolar.Api.Models;
using System.Security.Cryptography;

namespace SmartSolar.Api.Services;

public class ReservationService
{
    private readonly MongoContext _db;
    // Store the MongoDB context used for reservation operations.
    public ReservationService(MongoContext db)
    {
        _db = db;
    }

    // Load all records from the related MongoDB collection.
    public Task<List<EnergyReservation>> GetAllAsync()
    {
        return _db.Reservations.Find(_ => true).ToListAsync();
    }
    // Load reservations owned by a specific prosumer.
    public Task<List<EnergyReservation>> GetByProsumerAsync(string nic)
    {
        return _db.Reservations.Find(x => x.ProsumerNic == nic).ToListAsync();
    }
    // Load one record by its identifier.
    public async Task<EnergyReservation?> GetAsync(string id)
    {
        return await _db.Reservations.Find(x => x.Id == id).FirstOrDefaultAsync();
    }

    // Calculate fixed one-hour slots and their remaining capacity for a node.
    public async Task<List<AvailableSlot>> GetAvailableSlotsAsync(string nodeId, DateTime? requestedDate = null)
    {
        var node = await _db.Nodes.Find(x => x.Id == nodeId && x.IsActive).FirstOrDefaultAsync();
        if (node is null) return [];
        var now = DateTime.UtcNow;
        var slots = new List<AvailableSlot>();
        var schedules = node.Schedules.Count > 0
            ? node.Schedules
            : [new NodeSchedule { StartUtc = now.Date.AddHours(8), EndUtc = now.Date.AddHours(17), AvailableSlots = node.BatteryStorageSlots }];
        var firstDay = requestedDate?.Date ?? now.Date;
        var lastDay = requestedDate?.Date ?? now.Date.AddDays(7);
        if (firstDay < now.Date || firstDay > now.Date.AddDays(7)) return slots;
        for (var day = firstDay; day <= lastDay; day = day.AddDays(1))
        {
            foreach (var schedule in schedules)
            {
                var start = day.Add(schedule.StartUtc.TimeOfDay);
                var end = day.Add(schedule.EndUtc.TimeOfDay);
                if (end <= start) end = end.AddDays(1);
                for (var slotStart = start; slotStart.AddHours(1) <= end; slotStart = slotStart.AddHours(1))
                {
                    var slotEnd = slotStart.AddHours(1);
                    if (slotStart <= now || slotStart > now.AddDays(7)) continue;
                    var reserved = await _db.Reservations.CountDocumentsAsync(x => x.NodeId == nodeId
                        && (x.Status == ReservationStatus.Pending || x.Status == ReservationStatus.Approved)
                        && x.SlotStartUtc < slotEnd && slotStart < x.SlotEndUtc);
                    var remaining = Math.Max(0, schedule.AvailableSlots - (int)reserved);
                    slots.Add(new AvailableSlot($"{nodeId}:{slotStart.Ticks}", slotStart, slotEnd, remaining, remaining > 0, (int)reserved));
                }
            }
        }
        return slots.OrderBy(x => x.StartUtc).ToList();
    }

    // Convert a selected slot into a reservation request.
    public async Task<ApiResult<EnergyReservation>> CreateFromSlotAsync(string nic, string nodeId, string slotId, double energyKwh, bool approveImmediately)
    {
        if (!TryReadSlotId(slotId, nodeId, out var start)) return new(false, "The selected slot is invalid.", null);
        var reservation = new EnergyReservation { ProsumerNic = nic, NodeId = nodeId, SlotStartUtc = start, SlotEndUtc = start.AddHours(1), EnergyKwh = energyKwh };
        return await CreateAsync(reservation, approveImmediately);
    }

    // Convert a selected slot into an updated reservation request.
    public async Task<ApiResult<EnergyReservation>> UpdateFromSlotAsync(string id, MobileReservationRequest request, string? ownerNic)
    {
        if (!TryReadSlotId(request.SlotId, request.NodeId, out var start)) return new(false, "The selected slot is invalid.", null);
        return await UpdateAsync(id, new EnergyReservation { ProsumerNic = request.ProsumerNic, NodeId = request.NodeId, SlotStartUtc = start, SlotEndUtc = start.AddHours(1), EnergyKwh = request.EnergyKwh }, ownerNic);
    }

    // Insert a new record into the related MongoDB collection.
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

    // Approve a pending reservation and issue its QR transaction code.
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

    // Replace an existing record in the related MongoDB collection.
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

    // Cancel an open reservation after validating ownership and notice rules.
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

    // Finalize an approved reservation using its QR transaction code.
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

    // Apply booking business rules before a reservation is saved.
    private async Task<ApiResult<bool>> ValidateBookingAsync(EnergyReservation reservation, MicrogridNode node, string? ignoredId, bool requireNotice)
    {
        var window = ValidateReservationWindow(reservation.SlotStartUtc, reservation.SlotEndUtc, requireNotice);
        if (!window.Success) return window;
        if (reservation.EnergyKwh <= 0 || reservation.EnergyKwh > node.CapacityKwh)
            return new(false, "Energy amount must be positive and cannot exceed node capacity.", false);

        var prosumer = await _db.Prosumers.Find(x => x.Nic == reservation.ProsumerNic && x.Status == AccountStatus.Active).FirstOrDefaultAsync();
        if (prosumer is null) return new(false, "The prosumer account is not active.", false);

        var schedule = node.Schedules.FirstOrDefault(x => x.StartUtc.TimeOfDay <= reservation.SlotStartUtc.TimeOfDay && x.EndUtc.TimeOfDay >= reservation.SlotEndUtc.TimeOfDay);
        var slotCapacity = node.Schedules.Count > 0 ? schedule?.AvailableSlots ?? 0 : node.BatteryStorageSlots;
        if (slotCapacity <= 0) return new(false, "The selected node has no available schedule slot.", false);

        var overlapping = await _db.Reservations.CountDocumentsAsync(x =>
            x.Id != ignoredId && x.NodeId == reservation.NodeId
            && (x.Status == ReservationStatus.Pending || x.Status == ReservationStatus.Approved)
            && x.SlotStartUtc < reservation.SlotEndUtc && reservation.SlotStartUtc < x.SlotEndUtc);
        if (overlapping >= slotCapacity) return new(false, "The selected slot is already fully booked.", false);

        return new(true, "Reservation is valid.", true);
    }

    // Extract the reservation start time encoded in the selected slot id.
    private static bool TryReadSlotId(string slotId, string nodeId, out DateTime start)
    {
        start = default;
        var prefix = nodeId + ":";
        return slotId.StartsWith(prefix, StringComparison.Ordinal) && long.TryParse(slotId[prefix.Length..], out var ticks)
            && (start = new DateTime(ticks, DateTimeKind.Utc)) != default;
    }

    // Enforce the 7-day booking window and 12-hour change notice rule.
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
