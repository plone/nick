---
permalink: /rest-api/endpoints/database
parent: Endpoints
---

# Database

The `@database` endpoint exposes system information about the database.

Send a `GET` request to the `@database` endpoint:

```http
{% include_relative examples/database/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/database/get.ts %}
```

The response will contain the database information:

```http
{% include_relative examples/database/get.res %}
```
