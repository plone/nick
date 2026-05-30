---
permalink: /rest-api/endpoints/replace
parent: Endpoints
---

# Replace

## Replacing text across content

You can replace text across the entire site by invoking the `POST /@replace` endpoint. The `pattern` can be a plain string or a regular expression:

```http
{% include_relative examples/replace/post.req %}
```

Or use the client directly:

```ts
{% include_relative examples/replace/post.ts %}
```

The API will return a list of all content items that were modified:

```http
{% include_relative examples/replace/post.res %}
```
