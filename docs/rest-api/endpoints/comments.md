---
permalink: /endpoints/comments
parent: Endpoints
---

# Comments

Commenting is a feature that allows your site visitors to comment on web pages for any content object.

You can retrieve a list of all existing comments, add new comments, reply to existing comments, or delete a comment.

# Listing Comments

You can list the existing comment on a content object by sending a `GET` request to the URL of the content object and appending `/@comments`:

```http
{% include_relative examples/comments/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/comments/get.ts %}
```

Example response:

```http
{% include_relative examples/comments/get.res %}
```

The following fields are returned.

- @id: Link to the current endpoint
- items: a list of comments for the current resource
- items_total: the total number of comments for the resource

The items attribute returns a list of comments. Each comment provides the following fields.

- `@id`: hyperlink to the comment
- `@parent`: (optional) the parent comment
- `author_name`: the full name of the author of this comment
- `author_username`: the username of the author of this comment
- `comment_id`: the comment ID uniquely identifies the comment
- `in_reply_to`: the comment ID of the parent comment
- `creation_date`: when the comment was placed
- `modification_date: when the comment was last updated
- `text`: contains a `mime-type` and `text` attribute with the text of the comment. Default mime-type is text/plain.

## Adding a Comment

To add a new comment to a content object, send a `POST` request to the URL of the content object and append `/@comments` to the URL. The body of the request needs to contain a JSON structure with a `text` attribute that contains the comment text:

```http
{% include_relative examples/comments/post.req %}
```

Or use the client directly:

```ts
{% include_relative examples/comments/post.ts %}
```

Example response:

```http
{% include_relative examples/comments/post.res %}
```

## Replying to a Comment

To add a direct reply to an existing comment, send a `POST` request to the URL of the comment to which you want to reply. The body of the request needs to contain a JSON structure with a `text` attribute that contains the comment text:

```http
{% include_relative examples/comments/post_reply.req %}
```

Or use the client directly:

```ts
{% include_relative examples/comments/post_reply.ts %}
```

Example response:

```http
{% include_relative examples/comments/post_reply.res %}
```

## Updating a Comment

An existing comment can be updated by sending a `PATCH` request to the URL of the comment. The request body needs to contain a JSON structure with at least a `text` attribute:

```http
{% include_relative examples/comments/patch.req %}
```

Or use the client directly:

```ts
{% include_relative examples/comments/patch.ts %}
```

Example response:

```http
{% include_relative examples/comments/patch.res %}
```

## Deleting a Comment

An existing comment can be deleted by sending a `DELETE` request to the URL of the comment.

```http
{% include_relative examples/comments/delete.req %}
```

Or use the client directly:

```ts
{% include_relative examples/comments/delete.ts %}
```

Example response:

```http
{% include_relative examples/comments/delete.res %}
```
