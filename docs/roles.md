---
nav_order: 25
permalink: /endpoints/roles
parent: Endpoints
---

# Roles

Available roles in a Plone site can be queried by interacting with the `/@roles` endpoint on portal root (requires an authenticated user):

## List Roles

To retrieve a list of all roles in the portal, call the `/@roles` endpoint with a `GET` request:

```http
{% include_relative examples/roles/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/roles/get.ts %}
```

The server will respond with a list of all roles in the site:

```http
{% include_relative examples/roles/get.res %}
```

The role `title` is the translated role title.
