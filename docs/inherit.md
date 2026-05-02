---
nav_order: 16
permalink: /endpoints/inherit
parent: Endpoints
---

# Inherit

Content items are arranged in a hierarchy. Each content item has a parent, each of which may have its own parent, continuing all the way to the site root. Together, the chain of parents are ancestors of the content item.

The `@inherit` service makes it possible to access data from a behavior defined on one of these ancestors.

To use the service, send a `GET` request to the `@inherit` endpoint in the context of the content item that is the starting point for inheriting. Specify the `expand.inherit.behaviors` parameter as a comma-separated list of behaviors.

```http
{% include_relative examples/inherit/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/inherit/get.ts %}
```

For each behavior, the service will find the closest ancestor which provides that behavior. The result includes `from` (the `@id` and `title` of the item from which values were inherited) and `data` (values for any fields that are part of the behavior).

```http
{% include_relative examples/inherit/get.res %}
```

Ancestor items for which the current user lacks the `View` permission will be skipped.
