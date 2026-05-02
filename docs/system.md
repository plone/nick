---
nav_order: 27
permalink: /endpoints/system
parent: Endpoints
---

# System

The `@system` endpoint exposes system information about the Nick backend.

Send a `GET` request to the `@system` endpoint:

```http
{% include_relative examples/system/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/system/get.ts %}
```

The response will contain the system information:

```http
{% include_relative examples/system/get.res %}
```
