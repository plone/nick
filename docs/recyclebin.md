---
nav_order: 24
permalink: /endpoints/recyclebin
parent: Endpoints
---

# Recycle Bin

The Recycle Bin REST API provides endpoints to interact with the Recycle Bin functionality.

Reading or writing recycle bin data requires the `Manage Site` permission or be the `actor` of the document that was deleted.

## List recycle bin contents

A list of all items in the recycle bin can be retrieved by sending a `GET` request to the `@recyclebin` endpoint:

```http
{% include_relative examples/recyclebin/list.req %}
```

Or use the client directly:

```ts
{% include_relative examples/recyclebin/list.ts %}
```

The server will respond with a list of all recyclebin items in the site:

```http
{% include_relative examples/recyclebin/list.res %}
```

## Get individual item from recycle bin

To retrieve detailed information about a specific item in the recycle bin, including its sub-items, send a `GET` request to `@recyclebin/{item uuid}`.
The response includes an `items` list with all flattened descendants.

```http
{% include_relative examples/recyclebin/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/recyclebin/get.ts %}
```

The server will respond with the recyclebin item:

```http
{% include_relative examples/recyclebin/get.res %}
```

## Restore an item from the recycle bin

An item can be restored to its original location by issuing a `POST` to `@recyclebin/{item uuid}/restore`:

```http
{% include_relative examples/recyclebin/post.req %}
```

Or use the client directly:

```ts
{% include_relative examples/recyclebin/post.ts %}
```

The server will respond with the restored recyclebin item:

```http
{% include_relative examples/recyclebin/post.res %}
```

### Restore to a specific location

Pass a `target_path` in the request body to restore the item to a different folder:

```http
{% include_relative examples/recyclebin/post_target.req %}
```

Or use the client directly:

```ts
{% include_relative examples/recyclebin/post_target.ts %}
```

The server will respond with the restored recyclebin item:

```http
{% include_relative examples/recyclebin/post_target.res %}
```

## Purge a specific item from the recycle bin

To permanently delete a specific item, send a `DELETE` request to `@recyclebin/{item uuid}`:

```http
{% include_relative examples/recyclebin/delete.req %}
```

Or use the client directly:

```ts
{% include_relative examples/recyclebin/delete.ts %}
```

The server will respond with an ok message:

```http
{% include_relative examples/recyclebin/delete.res %}
```

## Empty the entire recycle bin

To permanently delete all items, send a `DELETE` request to `@recyclebin`:

```http
{% include_relative examples/recyclebin/delete_all.req %}
```

Or use the client directly:

```ts
{% include_relative examples/recyclebin/delete_all.ts %}
```

The server will respond with an ok message:

```http
{% include_relative examples/recyclebin/delete_all.res %}
```
