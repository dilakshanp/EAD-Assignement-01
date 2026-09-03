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
public class NodesController : ControllerBase
{
    private readonly NodeService _nodes;
    public NodesController(NodeService nodes) => _nodes = nodes;

    [HttpGet]
    public Task<List<MicrogridNode>> GetAll() => _nodes.GetAllAsync();

    [HttpGet("{id}")]
    public async Task<ActionResult<MicrogridNode>> Get(string id)
    {
        var node = await _nodes.GetAsync(id);
        return node is null ? NotFound() : Ok(node);
    }

    [HttpPost]
    public async Task<ApiResult<MicrogridNode>> Create(MicrogridNode node)
    {
        await _nodes.CreateAsync(node);
        return new(true, "Microgrid node created.", node);
    }

    [HttpPut("{id}")]
    public async Task<ApiResult<MicrogridNode>> Update(string id, MicrogridNode node)
    {
        node.Id = id;
        await _nodes.UpdateAsync(id, node);
        return new(true, "Microgrid node updated.", node);
    }

    [HttpPost("{id}/deactivate")]
    public Task<ApiResult<bool>> Deactivate(string id) => _nodes.DeactivateAsync(id);
}
