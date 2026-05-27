---
title: Groups
parent: Developer guide
permalink: /developer-guide/groups
---

# Groups

Groups define the initial user groups created when a profile is installed. They are defined in a `groups.json` file placed in a profile's directory and are automatically loaded during seeding.

## Structure

```json
{
  "purge": true,
  "groups": []
}
```

| Field    | Type      | Description                                                                   |
| -------- | --------- | ----------------------------------------------------------------------------- |
| `purge`  | `boolean` | When `true`, all existing groups are deleted before importing from this file. |
| `groups` | `array`   | List of group definitions to create.                                          |

### Group items

Each item in the `groups` array has:

| Field         | Type     | Description                                             |
| ------------- | -------- | ------------------------------------------------------- |
| `id`          | `string` | Unique identifier for the group.                        |
| `title:i18n`  | `string` | Display label (the `:i18n` suffix enables translation). |
| `description` | `string` | Optional description of the group.                      |
| `email`       | `string` | Optional email address for the group.                   |
| `roles`       | `array`  | List of role IDs assigned to all members of the group.  |

## Example

Place a file like `src/profiles/default/groups.json`:

```json
{
  "groups": [
    {
      "id": "Reviewers",
      "title:i18n": "Reviewers",
      "description": "Group for content reviewers",
      "roles": ["Reviewer"]
    }
  ]
}
```

The file is picked up automatically during seeding — no manual registration is required. When `purge` is `false` or omitted, new groups are added without removing existing ones.
