---
title: Health
nav_order: 7
permalink: /admin-guide/health
parent: Admin guide
---

# Health

Nick exposes a `/@health` endpoint that upstream systems (load balancers, orchestrators, monitoring tools) can poll to determine whether the service is healthy.

The response format follows the [Health Check Response RFC](https://inadarei.github.io/rfc-healthcheck/).

## Usage

```http
GET /@health HTTP/1.1
Accept: application/json
```

### Example Response (pass)

```json
{
  "@id": "http://localhost:8080/@health",
  "status": "pass",
  "checks": {
    "uptime": [
      {
        "componentType": "system",
        "observedValue": 4823,
        "observedUnit": "s",
        "status": "pass",
        "time": "2026-06-11T12:00:00.000Z"
      }
    ]
  }
}
```

### Status Values

| Status | Meaning                                                          |
| ------ | ---------------------------------------------------------------- |
| `pass` | All requests are completing within normal thresholds             |
| `warn` | Some requests are taking longer than expected (healthy but slow) |
| `fail` | One or more requests are stalled — the service is degraded       |

## How It Works

The endpoint inspects currently active (in-flight) requests and compares their duration against two configurable thresholds:

1. **Long-running threshold** — if any active request exceeds this, status becomes `warn`.
2. **Stalled threshold** — if any active request exceeds this, status becomes `fail`.

Uptime is calculated from when the server started and is always reported with status `pass`.

## Configuration

The thresholds are set via the `health` key in `config.ts`:

```typescript
export const config = {
  health: {
    long_running: 3, // seconds — warn when exceeded
    stalled: 30, // seconds — fail when exceeded
  },
};
```

| Key            | Default | Description                                                  |
| -------------- | ------- | ------------------------------------------------------------ |
| `long_running` | `3`     | Requests exceeding this many seconds trigger a `warn` status |
| `stalled`      | `30`    | Requests exceeding this many seconds trigger a `fail` status |

Tune these values based on your expected request latency. For example, a server with slow database queries or large file uploads may need higher thresholds:

```typescript
export const config = {
  health: {
    long_running: 10,
    stalled: 120,
  },
};
```
