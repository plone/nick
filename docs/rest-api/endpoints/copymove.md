---
permalink: /rest-api/endpoints/copymove
parent: Endpoints
---

# Copy and Move

## Copying an object

To copy a content object send a `POST` request to the `/@copy` endpoint at the destinations url with the source object specified in the request body. The source object can be specified either by path.

```http
{% include_relative examples/copymove/copy.req %}
```

Or use the client directly:

```ts
{% include_relative examples/copymove/copy.ts %}
```

If the copy operation succeeds, the server will respond with status 200 (OK) and return the new and old url of the copied object.

```http
{% include_relative examples/copymove/copy.res %}
```

## Moving an object

To move a content object send a `POST` request to the `/@move` endpoint at the destinations url with the source object specified in the request body. The source object can be specified either by path.

```http
{% include_relative examples/copymove/move.req %}
```

Or use the client directly:

```ts
{% include_relative examples/copymove/move.ts %}
```

If the move operation succeeds, the server will respond with status `200 OK` and return the new and old url of the moved object.

```http
{% include_relative examples/copymove/move.res %}
```

## Copying/moving multiple objects

Multiple objects can be moved/copied by giving a list of sources.

```http
{% include_relative examples/copymove/copy_multiple.req %}
```

Or use the client directly:

```ts
{% include_relative examples/copymove/copy_multiple.ts %}
```

If the operation succeeds, the server will respond with status `200 OK` and return the new and old urls for each copied/moved object.

```http
{% include_relative examples/copymove/copy_multiple.res %}
```
