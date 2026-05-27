---
title: Permissions
parent: Developer guide
permalink: /developer-guide/permissions
---

# Permissions

Permissions define the set of permission identifiers available in the system. They are defined in a `permissions.json` file placed in a profile's directory and are automatically loaded when the profile is installed.

## Structure

```json
{
  "purge": true,
  "permissions": []
}
```

| Field         | Type      | Description                                                                                                                                 |
| ------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `purge`       | `boolean` | When `true`, all existing permissions are deleted before importing from this file. Use this in a core profile to establish the initial set. |
| `permissions` | `array`   | List of permission definitions to create.                                                                                                   |

### Permission items

Each item in the `permissions` array has:

| Field        | Type     | Description                                                                                                                                               |
| ------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`         | `string` | Unique identifier for the permission (e.g. `"View"`, `"Modify"`, `"Manage Site"`). This string is referenced by workflows, actions, and role assignments. |
| `title:i18n` | `string` | Display label (the `:i18n` suffix enables translation).                                                                                                   |

## Example

Place a file like `src/profiles/default/permissions.json`:

```json
{
  "permissions": [
    {
      "id": "My Custom Permission",
      "title:i18n": "My Custom Permission"
    }
  ]
}
```

The file is picked up automatically during seeding — no manual registration is required. When `purge` is `false` or omitted, the permissions are added to the existing set rather than replacing it.
