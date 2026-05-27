---
title: Roles
parent: Developer guide
permalink: /developer-guide/roles
---

# Roles

Roles define user roles and their associated permissions. They are defined in a `roles.json` file placed in a profile's directory and are automatically loaded when the profile is installed.

## Structure

```json
{
  "purge": true,
  "roles": []
}
```

| Field   | Type      | Description                                                                  |
| ------- | --------- | ---------------------------------------------------------------------------- |
| `purge` | `boolean` | When `true`, all existing roles are deleted before importing from this file. |
| `roles` | `array`   | List of role definitions to create or update.                                |

### Role items

Each item in the `roles` array has:

| Field         | Type     | Description                                                                              |
| ------------- | -------- | ---------------------------------------------------------------------------------------- |
| `id`          | `string` | Unique identifier for the role (e.g. `"Anonymous"`, `"Editor"`, `"Administrator"`).      |
| `title:i18n`  | `string` | Display label (the `:i18n` suffix enables translation).                                  |
| `permissions` | `array`  | List of permission IDs assigned to this role.                                            |
| `order`       | `number` | Optional explicit ordering. Roles are ordered by their position in the array by default. |

If a role with the same `id` already exists, its permissions are merged — new permissions are added to the existing set without removing any.

## Example

Place a file like `src/profiles/default/roles.json`:

```json
{
  "roles": [
    {
      "id": "MyRole",
      "title:i18n": "My Role",
      "permissions": ["View", "Add"]
    }
  ]
}
```

The file is picked up automatically during seeding — no manual registration is required. When `purge` is `false` or omitted, roles are added or merged into the existing set rather than replacing it.
