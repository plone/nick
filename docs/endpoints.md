---
nav_order: 5
permalink: /rest-api/endpoints
partent: REST API
---

# Endpoints

A hypermedia API provides an entry point to the API, which contains hyperlinks the clients can follow. Just like a human user of a regular website, who knows the initial URL of a website and then follows hyperlinks to navigate through the site. This has the advantage that the client only needs to understand how to detect and follow links. The URLs (apart from the inital entry point) and other details of the API can change without breaking the client.

The entry point to the RESTful API is the portal root. The client can ask for a REST API response by setting the `Accept` HTTP header to `application/json`:

```http
{% include_relative examples/content/get_root.req %}
```

Or use the client directly:

```ts
{% include_relative examples/content/get_root.ts %}
```

The server will then respond with the portal root in the JSON format:

```http
{% include_relative examples/content/get_root.res %}
```

`@id` is a unique identifier for resources (IRIs). The `@id` property can be used to navigate through the web API by following the links.

`@type` sets the data type of a node or typed value

`items` is a list that contains all objects within that resource.

A client application can "follow" the links (by calling the `@id` property) to other resources. This allows to build a losely coupled client that does not break if some of the URLs change, only the entry point of the entire API (in our case the portal root) needs to be known in advance.

Another example, this time showing a request and response for a folder.

```http
{% include_relative examples/content/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/content/get.ts %}
```

```http
{% include_relative examples/content/get.res %}
```
