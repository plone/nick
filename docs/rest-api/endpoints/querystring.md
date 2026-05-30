---
permalink: /rest-api/endpoints/querystring
parent: Endpoints
---

# Querystring

The `@querystring` endpoint returns the querystring config.

Available options for the querystring can be queried by interacting with the `/@querystring` endpoint on portal root:

## Querystring Config

To retrieve all querystring options in the portal, call the `/@querystring` endpoint with a `GET` request:

```http
{% include_relative examples/querystring/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/querystring/get.ts %}
```

The server will respond with all querystring options in the portal:

```http
{% include_relative examples/querystring/get.res %}
```
