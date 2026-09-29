/*
 * File: ProsumersController.cs
 * Exposes API endpoints for prosumer registration, profile updates, and account status actions.
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
    private readonly UserService _users;
    private readonly AuthService _auth;

    // Store the services required for prosumer account endpoints.
    public ProsumersController(ProsumerService prosumers, UserService users, AuthService auth)
    {
        _prosumers = prosumers;
        _users = users;
        _auth = auth;
    }

    // Return all prosumer accounts visible to web operators.
    [HttpGet]
    public async Task<ActionResult<List<Prosumer>>> GetAll()
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice, UserRole.GridOperator))
            return StatusCode(StatusCodes.Status403Forbidden, new ApiResult<bool>(false, "You are not allowed to view prosumer accounts.", false));
        return Ok(await _prosumers.GetAllAsync());
    }

    // Return one prosumer profile after role or ownership checks.
    [HttpGet("{nic}")]
    public async Task<ActionResult<Prosumer>> Get(string nic)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice, UserRole.GridOperator)
            && AccessControl.ProsumerNic(Request) != nic)
            return StatusCode(StatusCodes.Status403Forbidden, new ApiResult<bool>(false, "You are not allowed to view prosumer accounts.", false));
        var prosumer = await _prosumers.GetAsync(nic);
        return prosumer is null ? NotFound() : Ok(prosumer);
    }

    // Register a mobile prosumer profile and matching login account.
    [HttpPost("register")]
    public async Task<ApiResult<Prosumer>> Register(ProsumerRegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nic))
            return new(false, "NIC is required.", null);
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return new(false, "Password must contain at least 6 characters.", null);
        if (request.SolarCapacityKw < 0)
            return new(false, "Solar capacity cannot be negative.", null);
        if (await _prosumers.GetAsync(request.Nic) is not null || await _users.GetByUsernameAsync(request.Nic) is not null)
            return new(false, "A prosumer with this NIC already exists.", null);

        var prosumer = new Prosumer
        {
            Nic = request.Nic,
            FullName = request.FullName,
            Phone = request.Phone,
            Email = request.Email,
            Address = request.Address,
            SolarCapacityKw = request.SolarCapacityKw,
            Status = AccountStatus.Active,
            CreatedAtUtc = DateTime.UtcNow
        };

        await _prosumers.UpsertAsync(prosumer);

        var existingUser = await _users.GetByUsernameAsync(request.Nic);
        if (existingUser is null)
        {
            await _users.CreateAsync(new AppUser
            {
                Username = request.Nic,
                PasswordHash = _auth.HashPassword(request.Password),
                Role = UserRole.Prosumer,
                ProsumerNic = request.Nic,
                Status = AccountStatus.Active
            });
        }

        return new(true, "Prosumer profile registered. Use your NIC and password to login.", prosumer);
    }


    // Allow an authenticated prosumer to update their own profile.
    [HttpPut("mobile/{nic}")]
    public async Task<ApiResult<Prosumer>> MobileUpdate(string nic, Prosumer prosumer)
    {
        if (!AccessControl.HasRole(Request, UserRole.Prosumer) || AccessControl.ProsumerNic(Request) != nic)
            return new(false, "Only the authenticated prosumer can update this profile.", null);
        prosumer.Nic = nic;
        var existing = await _prosumers.GetAsync(nic);
        prosumer.Status = existing?.Status ?? AccountStatus.Active;
        prosumer.CreatedAtUtc = existing?.CreatedAtUtc ?? DateTime.UtcNow;
        await _prosumers.UpsertAsync(prosumer);
        return new(true, "Prosumer profile updated.", prosumer);
    }

    // Allow Backoffice users to create or update a prosumer profile.
    [HttpPut("{nic}")]
    public async Task<ApiResult<Prosumer>> Upsert(string nic, Prosumer prosumer)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice))
            return new(false, "Only Backoffice users can save prosumer profiles.", null);
        prosumer.Nic = nic;
        await _prosumers.UpsertAsync(prosumer);
        return new(true, "Prosumer saved.", prosumer);
    }

    // Allow a prosumer to submit a deactivation request.
    [HttpPost("{nic}/request-deactivation")]
    public async Task<ApiResult<bool>> RequestDeactivation(string nic)
    {
        if (!AccessControl.HasRole(Request, UserRole.Prosumer) || AccessControl.ProsumerNic(Request) != nic)
            return new(false, "Only the authenticated prosumer can request deactivation.", false);
        await _prosumers.SetStatusAsync(nic, AccountStatus.PendingDeactivation);
        return new(true, "Deactivation request submitted.", true);
    }

    // Reactivate a prosumer account from Backoffice.
    [HttpPost("{nic}/activate")]
    public async Task<ApiResult<bool>> Activate(string nic)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice))
            return new(false, "Only Backoffice users can reactivate prosumer accounts.", false);
        await _prosumers.SetStatusAsync(nic, AccountStatus.Active);
        return new(true, "Prosumer activated.", true);
    }

    // Deactivate a prosumer account from Backoffice.
    [HttpPost("{nic}/deactivate")]
    public async Task<ApiResult<bool>> Deactivate(string nic)
    {
        if (!AccessControl.HasRole(Request, UserRole.Backoffice))
            return new(false, "Only Backoffice users can deactivate prosumer accounts.", false);
        await _prosumers.SetStatusAsync(nic, AccountStatus.Deactivated);
        return new(true, "Prosumer deactivated.", true);
    }
}

public record ProsumerRegisterRequest(string Nic, string FullName, string Phone, string Email, string Address, double SolarCapacityKw, string Password);
