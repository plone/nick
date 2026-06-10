---
permalink: /rest-api/endpoints/health
parent: Endpoints
---

# Health

The `@health` endpoint exposes system health information which can be used by upstream services.
The format is based on the specification of the [Health Check RFC](https://inadarei.github.io/rfc-healthcheck/).

Send a `GET` request to the `@health` endpoint:

```http
{% include_relative examples/health/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/health/get.ts %}
```

The response will contain the health information:

```http
{% include_relative examples/health/get.res %}
```
