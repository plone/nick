---
permalink: /endpoints/types
parent: Endpoints
---

# Types

Available content types can be listed and queried by accessing the `/@types` endpoint on any context (requires an authenticated user). The 'addable' key specifies if the content type can be added to the current context.

```http
{% include_relative examples/types/list.req %}
```

Or use the client directly:

```ts
{% include_relative examples/types/list.ts %}
```

```http
{% include_relative examples/types/list.res %}
```

## Get the schema with GET

To get the schema of a content type, access the `/@types` endpoint with the name of the content type, e.g. /@types/Page:

```http
{% include_relative examples/types/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/types/get.ts %}
```

```http
{% include_relative examples/types/get.res %}
```
