---
nav_order: 18
permalink: /endpoints/navigation
parent: Endpoints
---

# Navigation

## Top-Level Navigation

This endpoints returns all navigation items from the top level of the navigation root and adds additional items based on control panel settings. By default it will only return the first level of items but this can be expanded by providing the `expand.navigation.depth` parameter.

```http
{% include_relative examples/navigation/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/navigation/get.ts %}
```

Example response:

```http
{% include_relative examples/navigation/get.res %}
```
