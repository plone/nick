---
nav_order: 35
permalink: /endpoints/workflow
parent: Endpoints
---

# Workflow

All content has a workflow attached. We can get the current state and history of an object by issuing a `GET` request using on any context:

```http
{% include_relative examples/workflow/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/workflow/get.ts %}
```

```http
{% include_relative examples/workflow/get.res %}
```

Now, if we want to change the state of the front page to publish, we would proceed by issuing a `POST` request to the given URL:

```http
{% include_relative examples/workflow/post.req %}
```

Or use the client directly:

```ts
{% include_relative examples/workflow/post.ts %}
```

```http
{% include_relative examples/workflow/post.res %}
```
