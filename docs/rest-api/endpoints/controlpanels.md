---
permalink: /endpoints/controlpanels
parent: Endpoints
---

# Control panels

Control panels allow you to configure the global site setup. The `@controlpanels` endpoint allows you to list all existing control panels.

## Listing Control Panels

A list of all existing control panels in the portal can be retrieved by sending a `GET` request to the `@controlpanels` endpoint:

```http
{% include_relative examples/controlpanels/list.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/list.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/list.res %}
```

The following fields are returned:

- `@id`: hypermedia link to the control panel
- `title`: the title of the control panel
- `group`: the group in which the control panel should appear, for example, General, Content, Users, Security, Advanced, or Add-on Configuration.

## Retrieve a single Control Panel

To retrieve a single control panel, send a `GET` request to the URL of the control panel:

```http
{% include_relative examples/controlpanels/get.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/get.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/get.res %}
```

The following fields are returned:

- `@id`: hypermedia link to the control panel
- `title`: title of the control panel
- `group`: group name of the control panel
- `schema`: JSON Schema of the control panel
- `data`: current values of the control panel

## Updating a Control Panel

To update the settings on a control panel, send a `PATCH` request to control panel resource:

```http
{% include_relative examples/controlpanels/patch.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/patch.ts %}
```

A successful response to a `PATCH` request will be indicated by a 204 No Content response:

```http
{% include_relative examples/controlpanels/patch.res %}
```

## Control Panels not based on schemas

Control panels which are not based on schemas have a custom `@controlpanels/:panel` endpoint implementation.

### Content Types

`@controlpanels/dexterity-types` is a custom control panel endpoint that will allow you to add, remove, and configure available `types`.

Reading or writing content types require the `Manage Site` permission.

| Verb     | URL                                         | Action                                    |
| -------- | ------------------------------------------- | ----------------------------------------- |
| `GET`    | `/@controlpanels/dexterity-types`           | List configurable content types           |
| `POST`   | `/@controlpanels/dexterity-types`           | Creates a new content type                |
| `GET`    | `/@controlpanels/dexterity-types/{type-id}` | Get the current state of the content type |
| `PATCH`  | `/@controlpanels/dexterity-types/{type-id}` | Update the content type details           |
| `DELETE` | `/@controlpanels/dexterity-types/{type-id}` | Remove the content type                   |

#### Listing Content Types

To list the available content types, send a `GET` request to `@controlpanels/dexterity-types`

```http
{% include_relative examples/controlpanels/get_types.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/get_types.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/get_types.res %}
```

The following fields are returned:

- `@id`: hypermedia link to the control panel
- `title`: title of the control panel
- `group`: group name of the control panel
- `items`: list of configurable content types

#### Creating a new type with `POST`

To create a new content type, send a `POST` request to the `/@controlpanels/dexterity-types` endpoint:

```http
{% include_relative examples/controlpanels/post_types.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/post_types.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/post_types.res %}
```

#### Reading a type with `GET`

After a successful `POST`, access the content type by sending a `GET` request to the endpoint `/@controlpanels/dexterity-types/{type-id}`:

```http
{% include_relative examples/controlpanels/get_type.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/get_type.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/get_type.res %}
```

#### Updating a type with `PATCH`

To update an existing content type, send a `PATCH` request to the server.
`PATCH` allows to provide just a subset of the resource, that is, the values you actually want to change:

```http
{% include_relative examples/controlpanels/patch_type.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/patch_type.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/patch_type.res %}
```

#### Removing a type with `DELETE`

Delete an existing content type by sending a `DELETE` request to the URL of an existing content type:

```http
{% include_relative examples/controlpanels/delete_type.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/delete_type.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/delete_type.res %}
```

### Content Rules

`@controlpanels/content-rules` is a custom control panel endpoint that will allow you to add, remove, and configure available `Content Rules`.

Reading or writing content rules require the `Manage Site` permission.

| Verb     | URL                                       | Action                                    |
| -------- | ----------------------------------------- | ----------------------------------------- |
| `GET`    | `/@controlpanels/content-rules`           | List configurable content rules           |
| `POST`   | `/@controlpanels/content-rules`           | Creates a new content rule                |
| `GET`    | `/@controlpanels/content-rules/{rule-id}` | Get the current state of the content rule |
| `PATCH`  | `/@controlpanels/content-rules/{rule-id}` | Update the content rule details           |
| `DELETE` | `/@controlpanels/content-rules/{rule-id}` | Remove the content rule                   |

#### Listing Content Types

To list the available content rules, send a `GET` request to `@controlpanels/content-rules`

```http
{% include_relative examples/controlpanels/get_content_rules.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/get_content_rules.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/get_content_rules.res %}
```

The following fields are returned:

- `@id`: hypermedia link to the rule
- `id`: actual id of the content rule
- `assigned`: rule assigned or not
- `title`: title of the rule
- `description`: rule description
- `trigger`: triggering event
- `conditions`: conditions before triggering the rule
- `actions`: actions to take place

#### Creating a new Content rule with `POST`

To create a new content rule, send a `POST` request to the `/@controlpanels/content-rules` endpoint:

```http
{% include_relative examples/controlpanels/post_content_rules.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/post_content_rules.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/post_content_rules.res %}
```

#### Creating a new Condition on a Content rule with `POST`

To create a new condition on a content rule, send a `POST` request to the `/@controlpanels/content-rules/{rule-id}/condition` endpoint:

```http
{% include_relative examples/controlpanels/post_content_rules_condition.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/post_content_rules_condition.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/post_content_rules_condition.res %}
```

#### Creating a new Action on a Content rule with `POST`

To create a new action on a content rule, send a `POST` request to the `/@controlpanels/content-rules/{rule-id}/action` endpoint:

```http
{% include_relative examples/controlpanels/post_content_rules_action.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/post_content_rules_action.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/post_content_rules_action.res %}
```

#### Reading a Content rule with `GET`

After a successful `POST`, access the content rule by sending a `GET` request to the endpoint `/@controlpanels/content-rules/{rule-id}`:

```http
{% include_relative examples/controlpanels/get_content_rule.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/get_content_rule.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/get_content_rule.res %}
```

#### Updating a Content rule with `PATCH`

To update an existing content rule, send a `PATCH` request to the server.
`PATCH` allows to provide just a subset of the resource, that is, the values you actually want to change:

```http
{% include_relative examples/controlpanels/patch_content_rule.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/patch_content_rule.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/patch_content_rule.res %}
```

#### Updating a Condition on a Content rule with `PATCH`

To update an existing condition on a content rule, send a `PATCH` request to the server.
`PATCH` allows to provide just a subset of the resource, that is, the values you actually want to change:

```http
{% include_relative examples/controlpanels/patch_content_rule_condition.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/patch_content_rule_condition.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/patch_content_rule_condition.res %}
```

#### Updating an Action on a Content rule with `PATCH`

To update an existing action on a content rule, send a `PATCH` request to the server.
`PATCH` allows to provide just a subset of the resource, that is, the values you actually want to change:

```http
{% include_relative examples/controlpanels/patch_content_rule_action.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/patch_content_rule_action.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/patch_content_rule_action.res %}
```

#### Reorder a Condition on a Content rule with `PATCH`

To reorder an existing condition on a content rule, send a `PATCH` request to the server.
Specify the direction `_move_up` or `_move_down` in the `form.button.Move` attribute.

```http
{% include_relative examples/controlpanels/move_content_rule_condition.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/move_content_rule_condition.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/move_content_rule_condition.res %}
```

#### Reorder an Action on a Content rule with `PATCH`

To reorder an existing action on a content rule, send a `PATCH` request to the server.
Specify the direction `_move_up` or `_move_down` in the `form.button.Move` attribute.

```http
{% include_relative examples/controlpanels/move_content_rule_action.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/move_content_rule_action.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/move_content_rule_action.res %}
```

#### Removing a Content rule with `DELETE`

Delete an existing content rule by sending a `DELETE` request to the URL of an existing content rule:

```http
{% include_relative examples/controlpanels/delete_content_rule.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/delete_content_rule.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/delete_content_rule.res %}
```

### Removing a Condition on a Content rule with `DELETE`

Delete an existing condition on a content rule by sending a `DELETE` request to the URL of an existing content rule:

```http
{% include_relative examples/controlpanels/delete_content_rule_condition.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/delete_content_rule_condition.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/delete_content_rule_condition.res %}
```

### Removing an Action on a Content rule with `DELETE`

Delete an existing action on a content rule by sending a `DELETE` request to the URL of an existing content rule:

```http
{% include_relative examples/controlpanels/delete_content_rule_action.req %}
```

Or use the client directly:

```ts
{% include_relative examples/controlpanels/delete_content_rule_action.ts %}
```

Response:

```http
{% include_relative examples/controlpanels/delete_content_rule_action.res %}
```
