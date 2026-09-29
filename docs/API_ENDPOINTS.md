# API Endpoints

After login, send the returned token on protected requests:

```text
Authorization: Bearer <token>
```

## Authentication and Users

- `POST /api/auth/login`
- `POST /api/auth/users`
- `GET /api/auth/users`
- `PUT /api/auth/users/{id}`
- `POST /api/auth/users/{id}/activate`
- `POST /api/auth/users/{id}/deactivate`
- `DELETE /api/auth/users/{id}`

Backoffice users manage web users. Prosumers register through the prosumer registration endpoint.

## Prosumers

- `GET /api/prosumers`
- `GET /api/prosumers/{nic}`
- `POST /api/prosumers/register`
- `PUT /api/prosumers/mobile/{nic}`
- `PUT /api/prosumers/{nic}`
- `POST /api/prosumers/{nic}/request-deactivation`
- `POST /api/prosumers/{nic}/activate`
- `POST /api/prosumers/{nic}/deactivate`

NIC is the primary key for prosumer profiles.

## Microgrid Nodes

- `GET /api/nodes`
- `GET /api/nodes/{id}`
- `POST /api/nodes`
- `PUT /api/nodes/{id}`
- `PATCH /api/nodes/{id}/battery-slots`
- `POST /api/nodes/{id}/deactivate`
- `POST /api/nodes/{id}/activate`

Backoffice users manage full node details and schedules. Grid Operators can update battery slot availability.

## Reservations

- `GET /api/reservations`
- `GET /api/reservations/prosumer/{nic}`
- `GET /api/reservations/nodes/{nodeId}/available-slots?date=YYYY-MM-DD`
- `POST /api/reservations`
- `POST /api/reservations/from-slot`
- `PUT /api/reservations/{id}`
- `POST /api/reservations/{id}/cancel`
- `POST /api/reservations/mobile`
- `PUT /api/reservations/mobile/{id}`
- `POST /api/reservations/mobile/{id}/cancel`
- `POST /api/reservations/{id}/approve`
- `POST /api/reservations/complete-by-qr`

Reservation rules are enforced in the API: 7-day booking window, 12-hour update/cancel notice, slot capacity, and server-side QR completion verification.
