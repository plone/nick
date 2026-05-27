---
nav_order: 7
permalink: /endpoints/content-rules
parent: Endpoints
---

# Content Rules

A content rule will automatically perform an action when a certain event, known as a trigger, takes place.

Content rules can perform routine tasks, including the following.

- Move content from one folder to another when that content item is published.
- Send email when a content item is deleted.
- Delete content after a certain date.

Available content rules in a Nick site can be listed and queried by accessing the `/@content-rules` endpoint in any context. Access requires the `Modify` permission.

```http
{% include_relative examples/content_rules/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/content_rules/get.ts %}
```

Example response:

```http
{% include_relative examples/content_rules/get.res %}
```

The API consumer can assign, unassign, enable, disable, apply to subfolders, or disable apply to subfolders any of the rules available in the portal.

| Verb     | URL                              | Action                                                                |
| -------- | -------------------------------- | --------------------------------------------------------------------- |
| `POST`   | `/@content-rules/{rule-id}`      | Add rule to context                                                   |
| `GET`    | `/@content-rules/`               | Get acquired, assignable, and assigned rules                          |
| `PATCH`  | `/@content-rules/` with RAW Body | enable or disable, apply to subfolders or disable apply to subfolders |
| `DELETE` | `/@content-rules/` with RAW Body | Unassign rule on context                                              |

## Assigning an new Content rule with `POST`

To assign a content rule to a context, send a `POST` request to the `<context>/@content-rules` endpoint:

```http
{% include_relative examples/content_rules/post.req %}
```

Or use the client directly:

```ts
{% include_relative examples/content_rules/post.ts %}
```

Example response:

```http
{% include_relative examples/content_rules/post.res %}
```

## Changing content rules for a context with `PATCH`

To make changes on content rule assignments for a context, send a `PATCH` request to the `<context>/@content-rules` endpoint:

### Apply on subfolder

```http
{% include_relative examples/content_rules/patch_bubble.req %}
```

Or use the client directly:

```ts
{% include_relative examples/content_rules/patch_bubble.ts %}
```

Example response:

```http
{% include_relative examples/content_rules/patch_bubble.res %}
```

### Disable apply on subfolder

```http
{% include_relative examples/content_rules/patch_nobubble.req %}
```

Or use the client directly:

```ts
{% include_relative examples/content_rules/patch_nobubble.ts %}
```

Example response:

```http
{% include_relative examples/content_rules/patch_nobubble.res %}
```

### Enable

```http
{% include_relative examples/content_rules/patch_enable.req %}
```

Or use the client directly:

```ts
{% include_relative examples/content_rules/patch_enable.ts %}
```

Example response:

```http
{% include_relative examples/content_rules/patch_enable.res %}
```

### Disable

```http
{% include_relative examples/content_rules/patch_disable.req %}
```

Or use the client directly:

```ts
{% include_relative examples/content_rules/patch_disable.ts %}
```

Example response:

```http
{% include_relative examples/content_rules/patch_disable.res %}
```

## Unassign content rules with `DELETE`

To unassign content rules on a context, send a `DELETE` request to the `<context>/@content-rules` endpoint:

```http
{% include_relative examples/content_rules/delete.req %}
```

Or use the client directly:

```ts
{% include_relative examples/content_rules/delete.ts %}
```

Example response:

```http
{% include_relative examples/content_rules/delete.res %}
```
