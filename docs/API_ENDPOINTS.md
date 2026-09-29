# API Endpoints

## Authentication

- `POST /api/auth/login`
- `POST /api/auth/users`
- `GET /api/auth/users`

After login, send the returned token on protected requests:

`Authorization: Bearer <token>`

## Prosumers

- `GET /api/prosumers`
- `GET /api/prosumers/{nic}`
- `POST /api/prosumers/register`
- `PUT /api/prosumers/mobile/{nic}`
- `PUT /api/prosumers/{nic}`
- `POST /api/prosumers/{nic}/request-deactivation`
- `POST /api/prosumers/{nic}/activate`
- `POST /api/prosumers/{nic}/deactivate`

## Microgrid Nodes

- `GET /api/nodes`
- `GET /api/nodes/{id}`
- `POST /api/nodes`
- `PUT /api/nodes/{id}`
- `PATCH /api/nodes/{id}/battery-slots`
- `POST /api/nodes/{id}/deactivate`

## Reservations

- `GET /api/reservations`
- `GET /api/reservations/prosumer/{nic}`
- `GET /api/reservations/nodes/{nodeId}/available-slots`
- `POST /api/reservations`
- `POST /api/reservations/from-slot`
- `PUT /api/reservations/{id}`
- `POST /api/reservations/{id}/cancel`
- `POST /api/reservations/mobile`
- `PUT /api/reservations/mobile/{id}`
- `POST /api/reservations/mobile/{id}/cancel`
- `POST /api/reservations/{id}/approve`
- `POST /api/reservations/complete-by-qr`
