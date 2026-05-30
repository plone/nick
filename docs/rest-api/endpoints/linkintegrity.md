---
permalink: /rest-api/endpoints/linkintegrity
parent: Endpoints
---

# Link Integrity

When you create relations between content objects in Nick (for example, via relation fields or links in text blocks), these relations are stored in the database. The user interface will use those stored relations to show a warning when you try to delete a content object that is still referenced elsewhere. Link integrity avoids broken links ("breaches") in the site.

The `@linkintegrity` endpoint returns the list of reference breaches that would happen if some content items would be deleted. This information can be used to show the editor a confirmation dialog.

This check includes content objects that are located within a content object ("folderish content").

You can call the `/@linkintegrity` endpoint on the site root with a GET request and a list of content UIDs as a query parameter:

```http
{% include_relative examples/linkintegrity/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/linkintegrity/get.ts %}
```

The endpoint accepts a single parameter:

- `uids`: A list of object UIDs that you want to check.

The server will respond with the result:

```http
{% include_relative examples/linkintegrity/get.res %}
```

The result includes a list of objects corresponding to the UIDs that were requested. Each result object includes:

- `breaches`: A list of breaches (sources of relations that would be broken)
- `items_total`: Count of items contained inside the specified UIDs.
