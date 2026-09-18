/*
 * SE4040 Enterprise Application Development - Assignment 1
 * Smart Solar Microgrid Trading System
 * AI-assisted implementation; review and explain before submission.
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
    public ReservationsController(ReservationService reservations) => _reservations = reservations;

    [HttpGet]
    public Task<List<EnergyReservation>> GetAll() => _reservations.GetAllAsync();

    [HttpGet("prosumer/{nic}")]
    public Task<List<EnergyReservation>> GetByProsumer(string nic) => _reservations.GetByProsumerAsync(nic);

    [HttpPost]
    public Task<ApiResult<EnergyReservation>> Create(EnergyReservation reservation)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice, UserRole.GridOperator))
            return Task.FromResult(new ApiResult<EnergyReservation>(false, "Only Backoffice or Grid Operator users can create reservations from the web app.", null));
        return _reservations.CreateAsync(reservation);
    }

    [HttpPut("{id}")]
    public Task<ApiResult<EnergyReservation>> Update(string id, EnergyReservation reservation)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice, UserRole.GridOperator))
            return Task.FromResult(new ApiResult<EnergyReservation>(false, "Only Backoffice or Grid Operator users can update reservations.", null));
        return _reservations.UpdateAsync(id, reservation);
    }

    [HttpPost("{id}/cancel")]
    public Task<ApiResult<bool>> Cancel(string id)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice, UserRole.GridOperator))
            return Task.FromResult(new ApiResult<bool>(false, "Only Backoffice or Grid Operator users can cancel reservations.", false));
        return _reservations.CancelAsync(id);
    }

    [HttpPost("complete-by-qr")]
    public Task<ApiResult<EnergyReservation>> CompleteByQr(QrCompleteRequest request) => _reservations.CompleteByQrAsync(request.TransactionCode);
}

public record QrCompleteRequest(string TransactionCode);
