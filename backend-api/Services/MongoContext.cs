/*
 * SE4040 Enterprise Application Development - Assignment 1
 * Smart Solar Microgrid Trading System
 * AI-assisted implementation; review and explain before submission.
 */
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SmartSolar.Api.Models;
using SmartSolar.Api.Settings;

namespace SmartSolar.Api.Services;

public class MongoContext
{
    public IMongoCollection<AppUser> Users { get; }
    public IMongoCollection<Prosumer> Prosumers { get; }
    public IMongoCollection<MicrogridNode> Nodes { get; }
    public IMongoCollection<EnergyReservation> Reservations { get; }

    public MongoContext(IOptions<MongoDbSettings> options)
    {
        var client = new MongoClient(options.Value.ConnectionString);
        var db = client.GetDatabase(options.Value.DatabaseName);
        Users = db.GetCollection<AppUser>("Users");
        Prosumers = db.GetCollection<Prosumer>("Prosumers");
        Nodes = db.GetCollection<MicrogridNode>("SolarStationInfo");
        Reservations = db.GetCollection<EnergyReservation>("EnergyReservations");
    }
}
