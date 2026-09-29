/*
 * File: ReservationsController.cs
 * Exposes API endpoints for reservation booking, approval, cancellation, and QR completion.
 */
using Microsoft.AspNetCore.Mvc;
using SmartSolar.Api.Models;
using SmartSolar.Api.Services;

namespace SmartSolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly ReservationService _reservations;
    // Store the reservation service used by reservation endpoints.
    public ReservationsController(ReservationService reservations)
    {
        _reservations = reservations;
    }

    // Return reservations visible to Backoffice and Grid Operator users.
    [HttpGet]
    public async Task<ActionResult<List<EnergyReservation>>> GetAll()
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice, UserRole.GridOperator))
            return StatusCode(StatusCodes.Status403Forbidden, new ApiResult<bool>(false, "You are not allowed to view reservations.", false));
        return Ok(await _reservations.GetAllAsync());
    }

    // Return reservations for a specific prosumer after access checks.
    [HttpGet("prosumer/{nic}")]
    public async Task<ActionResult<List<EnergyReservation>>> GetByProsumer(string nic)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice, UserRole.GridOperator)
            && AccessControl.ProsumerNic(Request) != nic)
            return StatusCode(StatusCodes.Status403Forbidden, new ApiResult<bool>(false, "You are not allowed to view reservations.", false));
        return Ok(await _reservations.GetByProsumerAsync(nic));
    }

    // Return available fixed slots for a selected node and date.
    [HttpGet("nodes/{nodeId}/available-slots")]
    public async Task<ActionResult<List<AvailableSlot>>> AvailableSlots(string nodeId, DateTime? date)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice, UserRole.GridOperator, UserRole.Prosumer)) return StatusCode(StatusCodes.Status403Forbidden, new ApiResult<bool>(false, "You are not allowed to view reservations.", false));
        return Ok(await _reservations.GetAvailableSlotsAsync(nodeId, date));
    }

    // Create a web-managed reservation after role validation.
    [HttpPost]
    public Task<ApiResult<EnergyReservation>> Create(EnergyReservation reservation)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice, UserRole.GridOperator))
            return Task.FromResult(new ApiResult<EnergyReservation>(false, "Only Backoffice or Grid Operator users can create reservations from the web app.", null));
        return _reservations.CreateAsync(reservation);
    }

    // Create a web-managed reservation from a fixed slot selection.
    [HttpPost("from-slot")]
    public Task<ApiResult<EnergyReservation>> CreateFromSlot(ReservationSlotRequest request)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice, UserRole.GridOperator))
            return Task.FromResult(new ApiResult<EnergyReservation>(false, "Only Backoffice or Grid Operator users can create web reservations.", null));
        return _reservations.CreateFromSlotAsync(request.ProsumerNic, request.NodeId, request.SlotId, request.EnergyKwh, true);
    }

    // Update an existing reservation after role validation.
    [HttpPut("{id}")]
    public Task<ApiResult<EnergyReservation>> Update(string id, EnergyReservation reservation)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice, UserRole.GridOperator))
            return Task.FromResult(new ApiResult<EnergyReservation>(false, "Only Backoffice or Grid Operator users can update reservations.", null));
        return _reservations.UpdateAsync(id, reservation);
    }

    // Cancel a web-managed reservation after role validation.
    [HttpPost("{id}/cancel")]
    public Task<ApiResult<bool>> Cancel(string id)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice, UserRole.GridOperator))
            return Task.FromResult(new ApiResult<bool>(false, "Only Backoffice or Grid Operator users can cancel reservations.", false));
        return _reservations.CancelAsync(id);
    }


    // Allow an authenticated prosumer to create their own booking request.
    [HttpPost("mobile")]
    public Task<ApiResult<EnergyReservation>> MobileCreate(MobileReservationRequest request)
    {
        if (!AccessControl.HasRole(Request, UserRole.Prosumer) || AccessControl.ProsumerNic(Request) != request.ProsumerNic)
            return Task.FromResult(new ApiResult<EnergyReservation>(false, "Only the authenticated prosumer can create this reservation.", null));
        return _reservations.CreateFromSlotAsync(request.ProsumerNic, request.NodeId, request.SlotId, request.EnergyKwh, false);
    }

    // Allow an authenticated prosumer to update their own booking request.
    [HttpPut("mobile/{id}")]
    public async Task<ApiResult<EnergyReservation>> MobileUpdate(string id, MobileReservationRequest request)
    {
        if (!AccessControl.HasRole(Request, UserRole.Prosumer))
            return new(false, "Only prosumers can update reservations from mobile.", null);
        return await _reservations.UpdateFromSlotAsync(id, request, AccessControl.ProsumerNic(Request));
    }

    // Allow an authenticated prosumer to cancel their own booking request.
    [HttpPost("mobile/{id}/cancel")]
    public async Task<ApiResult<bool>> MobileCancel(string id)
    {
        if (!AccessControl.HasRole(Request, UserRole.Prosumer))
            return new(false, "Only prosumers can cancel reservations from mobile.", false);
        return await _reservations.CancelAsync(id, AccessControl.ProsumerNic(Request));
    }

    // Approve a pending reservation from the operator workflow.
    [HttpPost("{id}/approve")]
    public Task<ApiResult<EnergyReservation>> Approve(string id)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice, UserRole.GridOperator))
            return Task.FromResult(new ApiResult<EnergyReservation>(false, "Only Backoffice or Grid Operator users can approve reservations.", null));
        return _reservations.ApproveAsync(id);
    }

    // Complete an approved transfer after QR verification.
    [HttpPost("complete-by-qr")]
    public Task<ApiResult<EnergyReservation>> CompleteByQr(QrCompleteRequest request)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice, UserRole.GridOperator))
            return Task.FromResult(new ApiResult<EnergyReservation>(false, "Only Backoffice or Grid Operator users can finalize QR transfers.", null));
        return _reservations.CompleteByQrAsync(request.TransactionCode);
    }
}

public record QrCompleteRequest(string TransactionCode);
