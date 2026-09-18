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
public class ProsumersController : ControllerBase
{
    private readonly ProsumerService _prosumers;
    public ProsumersController(ProsumerService prosumers) => _prosumers = prosumers;

    [HttpGet]
    public Task<List<Prosumer>> GetAll() => _prosumers.GetAllAsync();

    [HttpGet("{nic}")]
    public async Task<ActionResult<Prosumer>> Get(string nic)
    {
        var prosumer = await _prosumers.GetAsync(nic);
        return prosumer is null ? NotFound() : Ok(prosumer);
    }

    // Creates or updates a prosumer profile using NIC as the primary key.
    [HttpPut("{nic}")]
    public async Task<ApiResult<Prosumer>> Upsert(string nic, Prosumer prosumer)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice))
            return new(false, "Only Backoffice users can save prosumer profiles.", null);
        prosumer.Nic = nic;
        await _prosumers.UpsertAsync(prosumer);
        return new(true, "Prosumer saved.", prosumer);
    }

    [HttpPost("{nic}/request-deactivation")]
    public async Task<ApiResult<bool>> RequestDeactivation(string nic)
    {
        await _prosumers.SetStatusAsync(nic, AccountStatus.PendingDeactivation);
        return new(true, "Deactivation request submitted.", true);
    }

    [HttpPost("{nic}/activate")]
    public async Task<ApiResult<bool>> Activate(string nic)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice))
            return new(false, "Only Backoffice users can reactivate prosumer accounts.", false);
        await _prosumers.SetStatusAsync(nic, AccountStatus.Active);
        return new(true, "Prosumer activated.", true);
    }

    [HttpPost("{nic}/deactivate")]
    public async Task<ApiResult<bool>> Deactivate(string nic)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice))
            return new(false, "Only Backoffice users can deactivate prosumer accounts.", false);
        await _prosumers.SetStatusAsync(nic, AccountStatus.Deactivated);
        return new(true, "Prosumer deactivated.", true);
    }
}
