# Smart Solar Microgrid Trading System Report

## 1. Introduction

Describe the purpose of the Smart Solar Microgrid Trading System and the users: Backoffice officers, Grid Operators, and Solar Prosumers.

## 2. System Architecture

The solution follows client-server architecture with a FAT service pattern. Business rules are implemented in the C# Web API. The web and Android applications act as UI clients and communicate with the API through REST endpoints. MongoDB stores server-side data, and Android SQLite stores local user/cache data.

## 3. High-Level Diagram

```mermaid
flowchart LR
    Web[React Web Client] --> API[C# Web API / IIS Hosted Service]
    Android[Native Android Java App] --> API
    Android --> SQLite[(SQLite Local DB)]
    API --> Mongo[(MongoDB Atlas)]
```

## 4. Use Case Diagram

```mermaid
flowchart TB
    Backoffice[Backoffice Officer]
    Operator[Grid Operator]
    Prosumer[Solar Prosumer]
    ManageUsers((Manage Users))
    ManageProsumers((Manage Prosumers))
    ManageNodes((Manage Microgrid Nodes))
    ManageSlots((Update Battery Slots))
    ManageReservations((Approve / Cancel Reservations))
    Register((Register / Edit Profile))
    BookSlot((Reserve / Modify / Cancel Slot))
    ViewBookings((View and Search Bookings))
    ViewMap((View Nearby Nodes on Map))
    ScanQR((Scan QR and Finalize Transfer))
    Backoffice --> ManageUsers
    Backoffice --> ManageProsumers
    Backoffice --> ManageNodes
    Backoffice --> ManageReservations
    Operator --> ManageSlots
    Operator --> ManageReservations
    Operator --> ScanQR
    Prosumer --> Register
    Prosumer --> BookSlot
    Prosumer --> ViewBookings
    Prosumer --> ViewMap
```

## 5. DFD

```mermaid
flowchart LR
    User[Users] --> Client[Web / Android Client]
    Client --> Api[Smart Solar API]
    Api --> Db[(MongoDB)]
    Android[Android Client] --> Local[(SQLite)]
```

## 6. Database Design

### Users

Fields: `id`, `username`, `passwordHash`, `role`, `status`, `prosumerNic`, `createdAtUtc`.

### Prosumers

Fields: `nic`, `fullName`, `phone`, `email`, `address`, `solarCapacityKw`, `status`, `createdAtUtc`.

### SolarStationInfo

Fields: `id`, `name`, `locationName`, `latitude`, `longitude`, `capacityKwh`, `batteryStorageSlots`, `isActive`, `schedules`.

### EnergyReservations

Fields: `id`, `prosumerNic`, `nodeId`, `slotStartUtc`, `slotEndUtc`, `energyKwh`, `status`, `transactionCode`, `createdAtUtc`, `updatedAtUtc`.

## 7. Business Rules

- Reservations must be scheduled within 7 days.
- Updates and cancellations require at least 12 hours notice.
- Nodes cannot be deactivated while active reservations exist.
- Deactivated prosumers can only be reactivated by a Backoffice officer.
- Grid Operators can update battery slot availability and finalize approved QR transfers.
- QR finalization is verified against the central server.

## 8. Screenshots

Add unique screenshots for every important UI:

- Web login and dashboard.
- Web user management.
- Web prosumer management.
- Web microgrid node management and fixed slot schedules.
- Web reservation management.
- Android login and prosumer registration.
- Android dashboard/trade screen.
- Android booking create/update/cancel flow.
- Android booking history/search.
- Android QR display.
- Android nearby nodes map.
- Android operator QR verification screen.
- Android account settings/deactivation request.

## 9. Source Code

Paste relevant source code as text. Do not use screenshots for code.

## 10. References

List Microsoft ASP.NET Core docs, MongoDB driver docs, Android SQLite docs, React/Vite docs, Google Maps docs, and ZXing QR scanning references.

## 11. Git Repository

Add GitHub repository link.

## 12. Individual Contribution

Clearly state each member's contribution.

## 14. Challenges

Discuss integration, API connectivity, MongoDB schema design, Android networking, QR handling, Google Maps key restrictions, and IIS deployment challenges.
