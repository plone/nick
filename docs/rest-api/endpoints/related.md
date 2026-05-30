---
permalink: /rest-api/endpoints/related
parent: Endpoints
---

# Related

This endpoint can be used to fetch related documents. For this endpoint to work you need to setup the different AI models as specified on the homepage of this documentation. The `@related` endpoint will return all the related documents based on embedding vectors. You can do the following request:

```http
{% include_relative examples/related/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/related/get.ts %}
```

Example response:

```http
{% include_relative examples/related/get.res %}
```
