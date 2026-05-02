---
nav_order: 7
permalink: /endpoints/contextnavigation
parent: Endpoints
---

# Context Navigation

## Context Navigation

The context navigation endpoint can be used to get the navigation in the current location. By default it will recursively get all the child nodes. The `expand.contextnavigation.bottomLevel` query parameter can be used to limit the depth it will go. The `expand.contextnavigation.includeTop` can be used to also include the top level node.

```http
{% include_relative examples/contextnavigation/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/contextnavigation/get.ts %}
```

Example response:

```http
{% include_relative examples/contextnavigation/get.res %}
```
