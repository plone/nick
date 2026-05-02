---
nav_order: 25
permalink: /endpoints/sharing
parent: Endpoints
---

# Sharing

Nick comes with a sophisticated user management system that allows to assign users and groups with global roles and permissions. Sometimes this in not enough though and you might want to give users the permission to access or edit a specific part of your website or a specific content object. This is where local roles located in the sharing tab come in handy.

## Retrieving Local Roles

The sharing information of a content object can be accessed by appending `/@sharing` to the `GET` request to the URL of a content object. E.g. to access the sharing information for a top-level folder, do:

```http
{% include_relative examples/sharing/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/sharing/get.ts %}
```

```http
{% include_relative examples/sharing/get.res %}
```

The `available_roles` property contains the list of roles that can be managed via the sharing page. It contains dictionaries with the role ID and its translated `title` (as it appears on the sharing page).

## Searching for principles

Users and/or groups without a sharing entry can be found by appending the argument `search` to the query string. ie `?search=admin`. Global roles are marked with the string `global`. Inherited roles are marked with the string `acquired`.

```http
{% include_relative examples/sharing/get_search.req %}
```

Or use the client directly:

```ts
{% include_relative examples/sharing/get_search.ts %}
```

```http
{% include_relative examples/sharing/get_search.res %}
```

## Updating Local Roles

You can update the _sharing_ information by sending a `POST` request to the object URL and appending `/@sharing`, e.g. `/news/@sharing`. E.g. say you want to give the `Administrators` group the `Reader` local role for a folder:

```http
{% include_relative examples/sharing/post.req %}
```

Or use the client directly:

```ts
{% include_relative examples/sharing/post.ts %}
```

```http
{% include_relative examples/sharing/post.res %}
```
