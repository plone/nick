---
permalink: /rest-api/endpoints/aliases
parent: Endpoints
---

# Aliases

A mechanism to redirect old URLs to new ones.

When an object is moved (renamed or cut/pasted into a different location), the redirection storage will remember the old path. It is smart enough to deal with transitive references (if we have a -> b and then add b -> c, it is replaced by a reference a -> c) and circular references (attempting to add a -> a does nothing).

The API consumer can create, read, and delete aliases.

| Verb     | URL         | Action                     |
| -------- | ----------- | -------------------------- |
| `POST`   | `/@aliases` | Add one or more aliases    |
| `GET`    | `/@aliases` | List all aliases           |
| `DELETE` | `/@aliases` | Remove one or more aliases |

## Adding new URL aliases for a Page

By default, Nick automatically creates a new alias when an object is renamed or moved. Still, you can also create aliases manually.

To create a new alias, send a `POST` request to the `/@aliases` endpoint:

```http
{% include_relative examples/aliases/post.req %}
```

Or use the client directly:

```ts
{% include_relative examples/aliases/post.ts %}
```

Response:

```http
{% include_relative examples/aliases/post.res %}
```

## Listing URL aliases of a Page

To list aliases, you can send a `GET` request to the `/@aliases` endpoint:

```http
{% include_relative examples/aliases/list.req %}
```

Or use the client directly:

```ts
{% include_relative examples/aliases/list.ts %}
```

Response:

```http
{% include_relative examples/aliases/list.res %}
```

## Removing URL aliases of a Page

To remove aliases, send a `DELETE` request to the `/@aliases` endpoint:

```http
{% include_relative examples/aliases/delete.req %}
```

Or use the client directly:

```ts
{% include_relative examples/aliases/delete.ts %}
```

Response:

```http
{% include_relative examples/aliases/delete.res %}
```

## Adding URL aliases in bulk

You can add multiple URL aliases for multiple pages by sending a `POST` request to the `/@aliases` endpoint on site `root` using a JSON payload.
**datetime** parameter is optional:

```http
{% include_relative examples/aliases/post_root.req %}
```

Or use the client directly:

```ts
{% include_relative examples/aliases/post_root.ts %}
```

Response:

```http
{% include_relative examples/aliases/post_root.res %}
```

## Listing all available aliases

To list all aliases, send a `GET` request to the `/@aliases` endpoint on site `root`:

```http
{% include_relative examples/aliases/list_root.req %}
```

Or use the client directly:

```ts
{% include_relative examples/aliases/list_root.ts %}
```

Response:

```http
{% include_relative examples/aliases/list_root.res %}
```

## Filter aliases

### Parameters

All of the following parameters are optional.

| Name      | Type    | Description                                          |
| --------- | ------- | ---------------------------------------------------- |
| `query`   | string  | Full-text search. Can match paths or text fields.    |
| `manual`  | boolean | Filter by manual or automatically created redirects. |
| `start`   | string  | Filter redirects created **after** this date.        |
| `end`     | string  | Filter redirects created **before** this date.       |
| `b_start` | integer | Batch start index (offset).                          |
| `b_size`  | integer | Batch size (maximum items returned).                 |

To search for specific aliases, send a `GET` request to the `@aliases` endpoint with one or more of the above named parameters as shown in the following example.

```http
{% include_relative examples/aliases/list_query.req %}
```

Or use the client directly:

```ts
{% include_relative examples/aliases/list_query.ts %}
```

Response:

```http
{% include_relative examples/aliases/list_query.res %}
```

## Bulk removing aliases

To bulk remove aliases send a `DELETE` request to the `/@aliases` endpoint on site `root`:

```http
{% include_relative examples/aliases/delete.req %}
```

Or use the client directly:

```ts
{% include_relative examples/aliases/delete.ts %}
```

Response:

```http
{% include_relative examples/aliases/delete.res %}
```
