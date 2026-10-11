/*
 * File: SeedData.cs
 * Adds default users and sample demonstration data when the API starts.
 */
using MongoDB.Driver;
using SmartSolar.Api.Models;

namespace SmartSolar.Api.Services;

public static class SeedData
{
    // Create or refresh demonstration users, prosumers, nodes, and reservations.
    public static async Task EnsureAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<MongoContext>();
        var auth = services.GetRequiredService<AuthService>();
        var now = DateTime.UtcNow;

        await UpsertUserAsync(db, auth, "admin", "admin123", UserRole.Backoffice, AccountStatus.Active, null);
        await UpsertUserAsync(db, auth, "operator", "operator123", UserRole.GridOperator, AccountStatus.Active, null);
        await UpsertUserAsync(db, auth, "fieldoperator", "operator123", UserRole.GridOperator, AccountStatus.Active, null);

        await UpsertProsumerAsync(db, auth, new Prosumer
        {
            Nic = "199812345678",
            FullName = "Kamal Perera",
            Phone = "0771234567",
            Email = "kamal.perera@test.com",
            Address = "No. 25, Main Street, Batticaloa, Sri Lanka",
            SolarCapacityKw = 5.5,
            Status = AccountStatus.Active,
            CreatedAtUtc = now.AddDays(-14)
        }, "prosumer123");

        await UpsertProsumerAsync(db, auth, new Prosumer
        {
            Nic = "199856789012",
            FullName = "Kasun Perera",
            Phone = "0712223344",
            Email = "kasun.perera@example.com",
            Address = "No. 10, Lake Road, Colombo, Sri Lanka",
            SolarCapacityKw = 4.8,
            Status = AccountStatus.PendingDeactivation,
            CreatedAtUtc = now.AddDays(-10)
        }, "prosumer123");

        await UpsertProsumerAsync(db, auth, new Prosumer
        {
            Nic = "200012345678",
            FullName = "Test Prosumer",
            Phone = "0777654321",
            Email = "prosumer@test.com",
            Address = "Colombo",
            SolarCapacityKw = 5,
            Status = AccountStatus.Active,
            CreatedAtUtc = now.AddDays(-7)
        }, "prosumer123");

        await UpsertProsumerAsync(db, auth, new Prosumer
        {
            Nic = "200205902066",
            FullName = "Dilakshan Pahithran",
            Phone = "0765554422",
            Email = "dilakshan@gmail.com",
            Address = "Batticaloa",
            SolarCapacityKw = 6.2,
            Status = AccountStatus.Deactivated,
            CreatedAtUtc = now.AddDays(-8)
        }, "prosumer123");

        await UpsertProsumerAsync(db, auth, new Prosumer
        {
            Nic = "199901234567",
            FullName = "Nimal Fernando",
            Phone = "0714445566",
            Email = "nimal.fernando@example.com",
            Address = "Negombo, Sri Lanka",
            SolarCapacityKw = 7.4,
            Status = AccountStatus.Active,
            CreatedAtUtc = now.AddDays(-18)
        }, "prosumer123");

        await UpsertProsumerAsync(db, auth, new Prosumer
        {
            Nic = "200112345679",
            FullName = "Sajani Wijesinghe",
            Phone = "0751112233",
            Email = "sajani.wijesinghe@example.com",
            Address = "Kandy, Sri Lanka",
            SolarCapacityKw = 3.8,
            Status = AccountStatus.Active,
            CreatedAtUtc = now.AddDays(-9)
        }, "prosumer123");

        await UpsertProsumerAsync(db, auth, new Prosumer
        {
            Nic = "199745678901",
            FullName = "Arun Raj", 
            Phone = "0778899001",
            Email = "arun.raj@example.com",
            Address = "Jaffna, Sri Lanka",
            SolarCapacityKw = 8.1,
            Status = AccountStatus.PendingDeactivation,
            CreatedAtUtc = now.AddDays(-21)
        }, "prosumer123");

        var colomboNode = await UpsertNodeAsync(db, new MicrogridNode
        {
            Name = "Colombo Central Solar Hub",
            LocationName = "Colombo",
            Latitude = 6.9271,
            Longitude = 79.8612,
            CapacityKwh = 250,
            BatteryStorageSlots = 12,
            IsActive = true,
            Schedules = DemoSchedules(now, 8, 17, 4)
        });

        var batticaloaNode = await UpsertNodeAsync(db, new MicrogridNode
        {
            Name = "Batticaloa Solar Hub",
            LocationName = "Batticaloa",
            Latitude = 7.7102,
            Longitude = 81.6924,
            CapacityKwh = 100,
            BatteryStorageSlots = 8,
            IsActive = true,
            Schedules = DemoSchedules(now, 9, 18, 3)
        });

        var kandyNode = await UpsertNodeAsync(db, new MicrogridNode
        {
            Name = "Kandy Hills Microgrid",
            LocationName = "Kandy",
            Latitude = 7.2906,
            Longitude = 80.6337,
            CapacityKwh = 150,
            BatteryStorageSlots = 6,
            IsActive = false,
            Schedules = DemoSchedules(now, 10, 16, 2)
        });

        var galleNode = await UpsertNodeAsync(db, new MicrogridNode
        {
            Name = "Galle Coastal Energy Hub",
            LocationName = "Galle",
            Latitude = 6.0535,
            Longitude = 80.2210,
            CapacityKwh = 180,
            BatteryStorageSlots = 10,
            IsActive = true,
            Schedules = DemoSchedules(now, 7, 16, 3)
        });

        var jaffnaNode = await UpsertNodeAsync(db, new MicrogridNode
        {
            Name = "Jaffna Northern Solar Exchange",
            LocationName = "Jaffna",
            Latitude = 9.6615,
            Longitude = 80.0255,
            CapacityKwh = 120,
            BatteryStorageSlots = 5,
            IsActive = true,
            Schedules = DemoSchedules(now, 8, 15, 2)
        });

        var negomboNode = await UpsertNodeAsync(db, new MicrogridNode
        {
            Name = "Negombo Lagoon Grid Point",
            LocationName = "Negombo",
            Latitude = 7.2083,
            Longitude = 79.8358,
            CapacityKwh = 90,
            BatteryStorageSlots = 4,
            IsActive = true,
            Schedules = DemoSchedules(now, 9, 17, 2)
        });

        await UpsertReservationAsync(db, "DEMO-PENDING-KAMAL", new EnergyReservation
        {
            ProsumerNic = "199812345678",
            NodeId = colomboNode.Id!,
            SlotStartUtc = NextSlot(now, 1, 9),
            SlotEndUtc = NextSlot(now, 1, 10),
            EnergyKwh = 25,
            Status = ReservationStatus.Pending,
            TransactionCode = "DEMO-PENDING-KAMAL",
            CreatedAtUtc = now.AddDays(-1),
            UpdatedAtUtc = now.AddDays(-1)
        });

        await UpsertReservationAsync(db, "DEMO-APPROVED-KAMAL", new EnergyReservation
        {
            ProsumerNic = "199812345678",
            NodeId = colomboNode.Id!,
            SlotStartUtc = NextSlot(now, 1, 11),
            SlotEndUtc = NextSlot(now, 1, 12),
            EnergyKwh = 55,
            Status = ReservationStatus.Approved,
            TransactionCode = "DEMO-APPROVED-KAMAL",
            CreatedAtUtc = now.AddHours(-8),
            UpdatedAtUtc = now.AddHours(-8)
        });

        await UpsertReservationAsync(db, "DEMO-PENDING-TEST", new EnergyReservation
        {
            ProsumerNic = "200012345678",
            NodeId = batticaloaNode.Id!,
            SlotStartUtc = NextSlot(now, 2, 14),
            SlotEndUtc = NextSlot(now, 2, 15),
            EnergyKwh = 10,
            Status = ReservationStatus.Pending,
            TransactionCode = "DEMO-PENDING-TEST",
            CreatedAtUtc = now.AddHours(-5),
            UpdatedAtUtc = now.AddHours(-5)
        });

        await UpsertReservationAsync(db, "DEMO-COMPLETED-TEST", new EnergyReservation
        {
            ProsumerNic = "200012345678",
            NodeId = colomboNode.Id!,
            SlotStartUtc = now.Date.AddDays(-1).AddHours(9),
            SlotEndUtc = now.Date.AddDays(-1).AddHours(10),
            EnergyKwh = 5,
            Status = ReservationStatus.Completed,
            TransactionCode = "DEMO-COMPLETED-TEST",
            CreatedAtUtc = now.AddDays(-2),
            UpdatedAtUtc = now.AddDays(-1)
        });

        await UpsertReservationAsync(db, "DEMO-CANCELLED-KAMAL", new EnergyReservation
        {
            ProsumerNic = "199812345678",
            NodeId = colomboNode.Id!,
            SlotStartUtc = now.Date.AddDays(-1).AddHours(13),
            SlotEndUtc = now.Date.AddDays(-1).AddHours(14),
            EnergyKwh = 30,
            Status = ReservationStatus.Cancelled,
            TransactionCode = "DEMO-CANCELLED-KAMAL",
            CreatedAtUtc = now.AddDays(-2),
            UpdatedAtUtc = now.AddDays(-1)
        });

        await UpsertReservationAsync(db, "DEMO-APPROVED-NIMAL", new EnergyReservation
        {
            ProsumerNic = "199901234567",
            NodeId = negomboNode.Id!,
            SlotStartUtc = NextSlot(now, 3, 10),
            SlotEndUtc = NextSlot(now, 3, 11),
            EnergyKwh = 18,
            Status = ReservationStatus.Approved,
            TransactionCode = "DEMO-APPROVED-NIMAL",
            CreatedAtUtc = now.AddHours(-7),
            UpdatedAtUtc = now.AddHours(-7)
        });

        await UpsertReservationAsync(db, "DEMO-PENDING-SAJANI", new EnergyReservation
        {
            ProsumerNic = "200112345679",
            NodeId = galleNode.Id!,
            SlotStartUtc = NextSlot(now, 4, 12),
            SlotEndUtc = NextSlot(now, 4, 13),
            EnergyKwh = 12.5,
            Status = ReservationStatus.Pending,
            TransactionCode = "DEMO-PENDING-SAJANI",
            CreatedAtUtc = now.AddHours(-4),
            UpdatedAtUtc = now.AddHours(-4)
        });

        await UpsertReservationAsync(db, "DEMO-APPROVED-ARUN", new EnergyReservation
        {
            ProsumerNic = "199745678901",
            NodeId = jaffnaNode.Id!,
            SlotStartUtc = NextSlot(now, 5, 9),
            SlotEndUtc = NextSlot(now, 5, 10),
            EnergyKwh = 20,
            Status = ReservationStatus.Approved,
            TransactionCode = "DEMO-APPROVED-ARUN",
            CreatedAtUtc = now.AddHours(-3),
            UpdatedAtUtc = now.AddHours(-3)
        });

        await UpsertReservationAsync(db, "DEMO-CANCELLED-NIMAL", new EnergyReservation
        {
            ProsumerNic = "199901234567",
            NodeId = galleNode.Id!,
            SlotStartUtc = now.Date.AddDays(-2).AddHours(14),
            SlotEndUtc = now.Date.AddDays(-2).AddHours(15),
            EnergyKwh = 16,
            Status = ReservationStatus.Cancelled,
            TransactionCode = "DEMO-CANCELLED-NIMAL",
            CreatedAtUtc = now.AddDays(-3),
            UpdatedAtUtc = now.AddDays(-2)
        });

        await UpsertReservationAsync(db, "DEMO-COMPLETED-SAJANI", new EnergyReservation
        {
            ProsumerNic = "200112345679",
            NodeId = colomboNode.Id!,
            SlotStartUtc = now.Date.AddDays(-3).AddHours(15),
            SlotEndUtc = now.Date.AddDays(-3).AddHours(16),
            EnergyKwh = 9,
            Status = ReservationStatus.Completed,
            TransactionCode = "DEMO-COMPLETED-SAJANI",
            CreatedAtUtc = now.AddDays(-4),
            UpdatedAtUtc = now.AddDays(-3)
        });

        _ = kandyNode;

        Console.WriteLine("Demo seed data refreshed: users, prosumers, nodes, schedules, and reservations are ready.");
    }

    // Create or update an application user by username.
    private static async Task UpsertUserAsync(MongoContext db, AuthService auth, string username, string password, UserRole role, AccountStatus status, string? prosumerNic)
    {
        var existing = await db.Users.Find(x => x.Username == username).FirstOrDefaultAsync();
        var user = existing ?? new AppUser { CreatedAtUtc = DateTime.UtcNow };
        user.Username = username;
        user.PasswordHash = auth.HashPassword(password);
        user.Role = role;
        user.Status = status;
        user.ProsumerNic = prosumerNic;

        if (existing is null)
            await db.Users.InsertOneAsync(user);
        else
            await db.Users.ReplaceOneAsync(x => x.Id == existing.Id, user);
    }

    // Create or update a prosumer profile and its matching login account.
    private static async Task UpsertProsumerAsync(MongoContext db, AuthService auth, Prosumer prosumer, string password)
    {
        await db.Prosumers.ReplaceOneAsync(x => x.Nic == prosumer.Nic, prosumer, new ReplaceOptions { IsUpsert = true });
        await UpsertUserAsync(db, auth, prosumer.Nic, password, UserRole.Prosumer, prosumer.Status, prosumer.Nic);
    }

    // Create or update a microgrid node by its display name.
    private static async Task<MicrogridNode> UpsertNodeAsync(MongoContext db, MicrogridNode node)
    {
        var existing = await db.Nodes.Find(x => x.Name == node.Name).FirstOrDefaultAsync();
        if (existing is not null) node.Id = existing.Id;

        if (existing is null)
            await db.Nodes.InsertOneAsync(node);
        else
            await db.Nodes.ReplaceOneAsync(x => x.Id == existing.Id, node);

        return node;
    }

    // Create or update a reservation by its transaction code.
    private static async Task UpsertReservationAsync(MongoContext db, string transactionCode, EnergyReservation reservation)
    {
        var existing = await db.Reservations.Find(x => x.TransactionCode == transactionCode).FirstOrDefaultAsync();
        if (existing is not null) reservation.Id = existing.Id;

        if (existing is null)
            await db.Reservations.InsertOneAsync(reservation);
        else
            await db.Reservations.ReplaceOneAsync(x => x.Id == existing.Id, reservation);
    }

    // Build fixed one-hour operating windows for the next demonstration week.
    private static List<NodeSchedule> DemoSchedules(DateTime now, int startHour, int endHour, int availableSlots)
    {
        return Enumerable.Range(0, 7)
            .Select(day => new NodeSchedule
            {
                StartUtc = now.Date.AddDays(day).AddHours(startHour),
                EndUtc = now.Date.AddDays(day).AddHours(endHour),
                AvailableSlots = availableSlots
            })
            .ToList();
    }

    // Return a stable future slot for demo reservations.
    private static DateTime NextSlot(DateTime now, int daysFromNow, int hour)
    {
        return now.Date.AddDays(daysFromNow).AddHours(hour);
    }
}
