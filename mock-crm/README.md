# Mock MadeMarket CRM Service

Simulates the MadeMarket REST API contract used by Valeon Partners in production.

## Endpoints

- `POST /api/deals` - Ingest an approved deal into the CRM pipeline.
- `GET /api/deals` - Retrieve all ingested deals in reverse chronological order.
- `GET /api/deals/:id` - Fetch a single deal by its CRM ID (`MM-...`).
- `GET /api/sync-log` - View the raw sync event stream.
- `DELETE /api/deals` - Reset the in-memory store for fresh testing runs.
- `GET /health` - Service health and active deal count.

## Production Mapping

In the full production architecture:
- This service is replaced by direct authenticated calls to the MadeMarket API (`https://api.mademarket.com/v1/deals`).
- Sync events are managed with retry policies, distributed locks, and dead-letter queues on Azure Service Bus.
