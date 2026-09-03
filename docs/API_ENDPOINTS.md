# API Endpoints

## Authentication

- `POST /api/auth/login`
- `POST /api/auth/users`
- `GET /api/auth/users`

## Prosumers

- `GET /api/prosumers`
- `GET /api/prosumers/{nic}`
- `PUT /api/prosumers/{nic}`
- `POST /api/prosumers/{nic}/request-deactivation`
- `POST /api/prosumers/{nic}/activate`
- `POST /api/prosumers/{nic}/deactivate`

## Microgrid Nodes

- `GET /api/nodes`
- `GET /api/nodes/{id}`
- `POST /api/nodes`
- `PUT /api/nodes/{id}`
- `POST /api/nodes/{id}/deactivate`

## Reservations

- `GET /api/reservations`
- `GET /api/reservations/prosumer/{nic}`
- `POST /api/reservations`
- `PUT /api/reservations/{id}`
- `POST /api/reservations/{id}/cancel`
- `POST /api/reservations/complete-by-qr`
