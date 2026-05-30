---
permalink: /rest-api/endpoints/groups
parent: Endpoints
---

# Groups

Available groups can be created, queried, updated and deleted by interacting with the `/@groups` endpoint on portal root (requires an authenticated user):

## List groups

To retrieve a list of all current groups in the portal, call the `/@groups` endpoint with a `GET` request:

```http
{% include_relative examples/groups/list.req %}
```

Or use the client directly:

```ts
{% include_relative examples/groups/list.ts %}
```

The server will respond with a list of all groups in the portal:

```http
{% include_relative examples/groups/list.res %}
```

The endpoint supports some basic filtering:

```http
{% include_relative examples/groups/list_query.req %}
```

Or use the client directly:

```ts
{% include_relative examples/groups/list_query.ts %}
```

The server will respond with a list the filtered groups in the portal with groupname starts with the query.

```http
{% include_relative examples/groups/list_query.res %}
```

## Create Group

To create a new group, send a `POST` request to the global `/@groups` endpoint with a JSON representation of the group you want to create in the body:

```http
{% include_relative examples/groups/post.req %}
```

Or use the client directly:

```ts
{% include_relative examples/groups/post.ts %}
```

If the group has been created successfully, the server will respond with a status `201 Created`. The `Location` header contains the URL of the newly created group and the resource representation in the payload:

```http
{% include_relative examples/groups/post.res %}
```

## Read Group

To retrieve all details for a particular group, send a `GET` request to the `/@groups` endpoint and append the group id to the URL:

```http
{% include_relative examples/groups/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/groups/get.ts %}
```

The server will respond with a `200 OK` status code and the JSON representation of the group in the body:

```http
{% include_relative examples/groups/get.res %}
```

## Update Group

To update the settings of a group, send a `PATCH` request with the group details you want to amend to the URL of that particular group:

```http
{% include_relative examples/groups/patch.req %}
```

Or use the client directly:

```ts
{% include_relative examples/groups/patch.ts %}
```

A successful response to a `PATCH` request will be indicated by a `204 No Content` response:

```http
{% include_relative examples/groups/patch.res %}
```

## Delete Group

To delete a group send a `DELETE` request to the `/@groups` endpoint and append the group id of the group you want to delete:

```http
{% include_relative examples/groups/delete.req %}
```

Or use the client directly:

```ts
{% include_relative examples/groups/delete.ts %}
```

A successful response will be indicated by a `204 No Content` response:

```http
{% include_relative examples/groups/delete.res %}
```
