---
nav_order: 2
permalink: /rest-api/content
parent: REST API
---

# Content Manipulation

The restapi does not only expose content objects via a RESTful API. The API consumer can create, read, update, and delete a content object. Those operations can be mapped to the HTTP verbs `POST` (Create), `GET` (Read), `PUT` (Update) and `DELETE` (Delete).

Manipulating resources across the network by using HTTP as an application protocol is one of core principles of the REST architectural pattern. This allows us to interact with a specific resource in a standardized way:

| Verb   | URL                     | Action                                    |
| ------ | ----------------------- | ----------------------------------------- |
| POST   | `/folder`               | Creates a new document within the folder  |
| GET    | `/folder/{document-id}` | Request the current state of the document |
| PATCH  | `/folder/{document-id}` | Update the document details               |
| DELETE | `/folder/{document-id}` | Remove the document                       |

## Creating a Resource with POST

To create a new resource, we send a `POST` request to the resource container. If we want to create a new document within an existing folder, we send a `POST` request to that folder:

```http
{% include_relative endpoints/examples/content/post.req %}
```

Or use the client directly:

```ts
{% include_relative endpoints/examples/content/post.ts %}
```

By setting the 'Accept' header, we tell the server that we would like to receive the response in the 'application/json' representation format.

The 'Content-Type' header indicates that the body uses the 'application/json' format.

The request body contains the minimal necessary information needed to create a document (the type and the title). You could set other properties, like "description" here as well.

### Successful Response (201 Created)

If a resource has been created, the server responds with the `201 Created` status code. The 'Location' header contains the URL of the newly created resource and the resource representation in the payload:

```http
{% include_relative endpoints/examples/content/post.res %}
```

### Unsuccessful Response (400 Bad Request)

If the resource could not be created, for instance because the title was missing in the request, the server responds with `400 Bad Request`:

```http
{% include_relative endpoints/examples/content/post_badrequest.res %}
```

The response body can contain information about why the request failed.

## Reading a Resource with GET

After a successful POST, we can access the resource by sending a GET request to the resource URL:

```http
{% include_relative endpoints/examples/content/get.req %}
```

Or use the client directly:

```ts
{% include_relative endpoints/examples/content/get.ts %}
```

### Successful Response (200 OK)

If a resource has been retrieved successfully, the server responds with `200 OK`:

```http
{% include_relative endpoints/examples/content/get.res %}
```

For folderish types, their childrens are automatically included in the response as items.

### Unsuccessful response (404 Not Found)

If a resource could not be found, the server will respond with `404 Not Found`:

```http
{% include_relative endpoints/examples/content/get_notfound.res %}
```

### GET Responses

Possible server reponses for a `GET` request are:

- 200 OK
- 404 Not Found
- 500 Internal Server Error

## Updating a Resource with PATCH

To update an existing resource we send a `PATCH` request to the server. `PATCH` allows to provide just a subset of the resource (the values you actually want to change).

If you send the value `null` for a field, the field's content will be deleted. Note that this is not possible if the field is required.

```http
{% include_relative endpoints/examples/content/patch.req %}
```

Or use the client directly:

```ts
{% include_relative endpoints/examples/content/patch.ts %}
```

### Successful Response (204 No Content)

A successful response to a PATCH request will be indicated by a `204 No Content` response by default:

```http
{% include_relative endpoints/examples/content/patch.res %}
```

## Removing a Resource with DELETE

We can delete an existing resource by sending a DELETE request:

```http
{% include_relative endpoints/examples/content/delete.req %}
```

Or use the client directly:

```ts
{% include_relative endpoints/examples/content/delete.ts %}
```

A successful response will be indicated by a `204 No Content` response:

```http
{% include_relative endpoints/examples/content/delete.res %}
```

### DELETE Repsonses

- 204 No Content
- 404 Not Found (if the resource does not exist)
- 405 Method Not Allowed (if deleting the resource is not allowed)
- 500 Internal Server Error

## Reordering sub resources

The resources contained within a resource can be reordered using the `ordering` key using a PATCH request on the container.

Use the `obj_id` subkey to specify which resource to reorder. The subkey `delta` can be 'top', 'bottom', or a negative or positive integer for moving up or down.

```http
{% include_relative endpoints/examples/content/patch_reorder.req %}
```

Or use the client directly:

```ts
{% include_relative endpoints/examples/content/patch_reorder.ts %}
```

## Exporting a Resource with GET

We can use the `@export` endpoint to export the content to a `json`-file to be used for migrations or external services. We can export the resource by sending a GET request to the resource URL:

```http
{% include_relative endpoints/examples/content/export.req %}
```

Or use the client directly:

```ts
{% include_relative endpoints/examples/content/export.ts %}
```

### Successful Response (200 OK)

If a resource has been retrieved successfully, the server responds with `200 OK`:

```http
{% include_relative endpoints/examples/content/export.res %}
```

## Exporting ICS format

We can use the `ics_view` endpoint to export the event content to an iCalendar file to be used for external services. We can export the data by sending a GET request to the resource URL:

```http
{% include_relative endpoints/examples/content/ics.req %}
```

Or use the client directly:

```ts
{% include_relative endpoints/examples/content/ics.ts %}
```

### Successful Response (200 OK)

If a resource has been retrieved successfully, the server responds with `200 OK`:

```http
{% include_relative endpoints/examples/content/ics.res %}
```

## Exporting ICS format on a path

We can also use the `ics_view` endpoint to export multiple events. When we call the `ics_view` on a path it will fetch all events from this path down in an iCalendar file. We can export the data by sending a GET request to the resource URL:

```http
{% include_relative endpoints/examples/content/ics_folder.req %}
```

Or use the client directly:

```ts
{% include_relative endpoints/examples/content/ics_folder.ts %}
```

### Successful Response (200 OK)

If a resource has been retrieved successfully, the server responds with `200 OK`:

```http
{% include_relative endpoints/examples/content/ics_folder.res %}
```

# Exporting RSS format on a path

We can call the `rss_view` endpoint to export the content in RSS format. When we call the `rss_view` on a path it will fetch all content from this path down in a RSS file. We can export the data by sending a GET request to the resource URL:

```http
{% include_relative endpoints/examples/content/rss.req %}
```

Or use the client directly:

```ts
{% include_relative endpoints/examples/content/rss.ts %}
```

## Successful Response (200 OK)

If a resource has been retrieved successfully, the server responds with `200 OK`:

```http
{% include_relative endpoints/examples/content/rss.res %}
```
