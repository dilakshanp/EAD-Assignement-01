/*
 * File: UserService.cs
 * Provides data access operations for application user accounts.
 */
using MongoDB.Driver;
using SmartSolar.Api.Models;

namespace SmartSolar.Api.Services;

public class UserService
{
    private readonly MongoContext _db;
    // Store the MongoDB context used for user operations.
    public UserService(MongoContext db)
    {
        _db = db;
    }

    // Load all records from the related MongoDB collection.
    public Task<List<AppUser>> GetAllAsync()
    {
        return _db.Users.Find(_ => true).ToListAsync();
    }
    // Load a user account by its MongoDB identifier.
    public async Task<AppUser?> GetByIdAsync(string id)
    {
        return await _db.Users.Find(x => x.Id == id).FirstOrDefaultAsync();
    }
    // Load a user account by username or NIC.
    public async Task<AppUser?> GetByUsernameAsync(string username)
    {
        return await _db.Users.Find(x => x.Username == username).FirstOrDefaultAsync();
    }
    // Check whether a username is already used by another account.
    public async Task<bool> UsernameExistsAsync(string username, string? exceptId = null)
    {
        return await _db.Users.Find(x => x.Username == username && x.Id != exceptId).AnyAsync();
    }
    // Insert a new record into the related MongoDB collection.
    public Task CreateAsync(AppUser user)
    {
        return _db.Users.InsertOneAsync(user);
    }
    // Replace an existing record in the related MongoDB collection.
    public Task UpdateAsync(AppUser user)
    {
        return _db.Users.ReplaceOneAsync(x => x.Id == user.Id, user);
    }
    // Delete a user account by its identifier.
    public Task<DeleteResult> DeleteAsync(string id)
    {
        return _db.Users.DeleteOneAsync(x => x.Id == id);
    }
    // Update the lifecycle status of a user account.
    public Task UpdateStatusAsync(string id, AccountStatus status)
    {
        return _db.Users.UpdateOneAsync(x => x.Id == id, Builders<AppUser>.Update.Set(x => x.Status, status));
    }
}
