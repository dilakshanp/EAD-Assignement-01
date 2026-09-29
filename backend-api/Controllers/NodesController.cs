/*
 * File: NodesController.cs
 * Exposes API endpoints for microgrid nodes, schedules, and battery slot availability.
 */
using Microsoft.AspNetCore.Mvc;
using SmartSolar.Api.Models;
using SmartSolar.Api.Services;

namespace SmartSolar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NodesController : ControllerBase
{
    private readonly NodeService _nodes;
    // Store the node service used by node endpoints.
    public NodesController(NodeService nodes)
    {
        _nodes = nodes;
    }

    // Return all microgrid nodes visible to authorized clients.
    [HttpGet]
    public async Task<ActionResult<List<MicrogridNode>>> GetAll()
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice, UserRole.GridOperator, UserRole.Prosumer))
            return StatusCode(StatusCodes.Status403Forbidden, new ApiResult<bool>(false, "You are not allowed to view microgrid nodes.", false));
        return Ok(await _nodes.GetAllAsync());
    }

    // Return one microgrid node after access checks.
    [HttpGet("{id}")]
    public async Task<ActionResult<MicrogridNode>> Get(string id)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice, UserRole.GridOperator, UserRole.Prosumer))
            return StatusCode(StatusCodes.Status403Forbidden, new ApiResult<bool>(false, "You are not allowed to view microgrid nodes.", false));
        var node = await _nodes.GetAsync(id);
        return node is null ? NotFound() : Ok(node);
    }

    // Create a microgrid node after Backoffice validation.
    [HttpPost]
    public async Task<ApiResult<MicrogridNode>> Create(MicrogridNode node)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice))
            return new(false, "Only Backoffice users can register microgrid nodes.", null);
        var validation = _nodes.Validate(node);
        if (!validation.Success) return new(false, validation.Message, null);
        await _nodes.CreateAsync(node);
        return new(true, "Microgrid node created.", node);
    }

    // Update microgrid node details and schedules after Backoffice validation.
    [HttpPut("{id}")]
    public async Task<ApiResult<MicrogridNode>> Update(string id, MicrogridNode node)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice))
            return new(false, "Only Backoffice users can update node details and schedules.", null);
        var validation = _nodes.Validate(node);
        if (!validation.Success) return new(false, validation.Message, null);
        node.Id = id;
        await _nodes.UpdateAsync(id, node);
        return new(true, "Microgrid node updated.", node);
    }

    // Allow operators to update only battery slot availability.
    [HttpPatch("{id}/battery-slots")]
    public Task<ApiResult<MicrogridNode>> UpdateBatterySlots(string id, BatterySlotsRequest request)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice, UserRole.GridOperator))
            return Task.FromResult(new ApiResult<MicrogridNode>(false, "Only Backoffice or Grid Operator users can update battery slot availability.", null));
        return _nodes.UpdateBatterySlotsAsync(id, request.BatteryStorageSlots);
    }

    // Deactivate a node after verifying there are no active reservations.
    [HttpPost("{id}/deactivate")]
    public Task<ApiResult<bool>> Deactivate(string id)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice))
            return Task.FromResult(new ApiResult<bool>(false, "Only Backoffice users can deactivate microgrid nodes.", false));
        return _nodes.DeactivateAsync(id);
    }

    // Reactivate an existing microgrid node after Backoffice validation.
    [HttpPost("{id}/activate")]
    public Task<ApiResult<bool>> Activate(string id)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice))
            return Task.FromResult(new ApiResult<bool>(false, "Only Backoffice users can reactivate microgrid nodes.", false));
        return _nodes.ActivateAsync(id);
    }
}

public record BatterySlotsRequest(int BatteryStorageSlots);
