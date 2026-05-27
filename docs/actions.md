---
nav_order: 1
permalink: /rest-api/endpoints/actions
parent: Endpoints
---

# Actions

Actions can be configured in the backend. Each actions defines an id, a title and the required permissions to decide if the action will be available for a user. Actions are sorted by categories.

Actions can be used to build UI elements that adapt to the available actions. An example is the toolbar where the "object_tabs" (view, edit, folder contents, sharing) and the "user_actions" (login, logout, preferences) are used to display the user only the actions that are allowed for the currently logged in user.

The available actions for the currently logged in user can be retrieved by calling the `@actions` endpoint on a specific context. This also works for not authenticated users.

## Listing available actions

To list the available actions, send a GET request to the `@actions` endpoint on a specific content object:

```http
{% include_relative examples/actions/get_authenticated.req %}
```

Or use the client directly:

```ts
{% include_relative examples/actions/get_authenticated.ts %}
```

The server will respond with a 200 OK status code. The JSON response contains the available actions categories (object, object_buttons, user) on the top level. Each category contains a list of the available actions in that category:

```http
{% include_relative examples/actions/get_authenticated.res %}
```
