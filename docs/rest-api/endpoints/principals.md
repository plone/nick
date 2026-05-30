---
permalink: /rest-api/endpoints/principals
parent: Endpoints
---

# Principals

This endpoint will search for all the available principals in when given a query string. We define a principal as any user or group in the system. This endpoint requires an authenticated user.

## Search Principals

To retrieve a list of principals given a search string, call the `/@principals` endpoint with a `GET` request and a search query parameter:

```http
{% include_relative examples/principals/list.req %}
```

Or use the client directly:

```ts
{% include_relative examples/principals/list.ts %}
```

The server will respond with a list of the users and groups in the portal that match the query string:

```http
{% include_relative examples/principals/list.res %}
```
