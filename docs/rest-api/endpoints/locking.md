---
permalink: /rest-api/endpoints/locking
parent: Endpoints
---

# Locking

Locking is a mechanism to prevent users from accidentially overriding each others changes.

When a user edits a content object, the object is locked until the user hits the save or cancel button. If a second user tries to edit the object at the same time, she will see a message that this object is locked.

The API consumer can create, read, update, and delete a content-type lock.

| Verb   | URL      | Action                                 |
| ------ | -------- | -------------------------------------- |
| POST   | `/@lock` | Lock an object                         |
| GET    | `/@lock` | Get information about the current lock |
| PATCH  | `/@lock` | Refresh existing lock                  |
| DELETE | `/@lock` | Unlock an object                       |

## Locking an object

To lock an object send a `POST` request to the `/@lock` endpoint that is available on any content object:

```http
{% include_relative examples/locking/post.req %}
```

Or use the client directly:

```ts
{% include_relative examples/locking/post.ts %}
```

If the lock operation succeeds, the server will respond with status `200 OK` and return various information about the lock including the lock token. The token is needed in later requests to update the locked object.

```http
{% include_relative examples/locking/post.res %}
```

By default, locks are stealable. That means that another user can unlock the object. If you want to create a non-stealable lock, pass `"stealable": false` in the request body.

To create a lock with a non-default timeout, you can pass the the timeout value in seconds in the request body.

The following example creates a non-stealable lock with a timeout of 1h.

```http
{% include_relative examples/locking/post_options.req %}
```

Or use the client directly:

```ts
{% include_relative examples/locking/post_options.ts %}
```

The server responds with status `200 OK` and returns the lock information.

```http
{% include_relative examples/locking/post_options.res %}
```

## Unlocking an object

To unlock an object send a `DELETE` request to the `/@lock` endpoint.

```http
{% include_relative examples/locking/delete.req %}
```

Or use the client directly:

```ts
{% include_relative examples/locking/delete.ts %}
```

The server responds with status 200 OK and returns the lock information.

```http
{% include_relative examples/locking/delete.res %}
```

To unlock an object locked by another user send a force `DELETE` request to the `/@lock` endpoint.

```http
{% include_relative examples/locking/delete_force.req %}
```

Or use the client directly:

```ts
{% include_relative examples/locking/delete_force.ts %}
```

The server responds with status `200 OK` and returns the lock information.

```http
{% include_relative examples/locking/delete_force.res %}
```

## Refreshing a lock

An existing lock can be refreshed by sending a PATCH request to the `@lock` endpoint.

```http
{% include_relative examples/locking/patch.req %}
```

Or use the client directly:

```ts
{% include_relative examples/locking/patch.ts %}
```

The server responds with status `200 OK` and returns the lock information containing the updated creation time.

```http
{% include_relative examples/locking/patch.res %}
```

## Getting lock information

To find out if an object is locked or to get information about the current lock you can send a `GET` request to the `@lock` endpoint.

```http
{% include_relative examples/locking/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/locking/get.ts %}
```

The server responds with status `200 OK` and returns the information about the lock.

```http
{% include_relative examples/locking/get.res %}
```

## Updating a locked object

To update a locked object with a PATCH request, you have to provide the lock token with the `Lock-Token` header.

```http
{% include_relative examples/locking/update.req %}
```

Or use the client directly:

```ts
{% include_relative examples/locking/update.ts %}
```
