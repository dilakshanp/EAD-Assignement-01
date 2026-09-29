/*
 * SE4040 Enterprise Application Development - Assignment 1
 * Smart Solar Microgrid Trading System
 * AI-assisted implementation; review and explain before submission.
 */
using MongoDB.Driver;
using SmartSolar.Api.Models;

namespace SmartSolar.Api.Services;

public class UserService
{
    private readonly MongoContext _db;
    public UserService(MongoContext db) => _db = db;

    public Task<List<AppUser>> GetAllAsync() => _db.Users.Find(_ => true).ToListAsync();
    public async Task<AppUser?> GetByIdAsync(string id) => await _db.Users.Find(x => x.Id == id).FirstOrDefaultAsync();
    public async Task<AppUser?> GetByUsernameAsync(string username) => await _db.Users.Find(x => x.Username == username).FirstOrDefaultAsync();
    public async Task<bool> UsernameExistsAsync(string username, string? exceptId = null) =>
        await _db.Users.Find(x => x.Username == username && x.Id != exceptId).AnyAsync();
    public Task CreateAsync(AppUser user) => _db.Users.InsertOneAsync(user);
    public Task UpdateAsync(AppUser user) => _db.Users.ReplaceOneAsync(x => x.Id == user.Id, user);
    public Task<DeleteResult> DeleteAsync(string id) => _db.Users.DeleteOneAsync(x => x.Id == id);
    public Task UpdateStatusAsync(string id, AccountStatus status) =>
        _db.Users.UpdateOneAsync(x => x.Id == id, Builders<AppUser>.Update.Set(x => x.Status, status));
}
