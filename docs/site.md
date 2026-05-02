---
nav_order: 26
permalink: /endpoints/site
parent: Endpoints
---

# Site

The `@site` endpoint provides general site-wide information, such as the site title, logo, and other information. It uses the view permission, which requires appropriate authorization.

Send a `GET` request to the `@site` endpoint:

```http
{% include_relative examples/site/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/site/get.ts %}
```

The response will contain the site information:

```http
{% include_relative examples/site/get.res %}
```
