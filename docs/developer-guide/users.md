---
title: Users
parent: Developer guide
permalink: /developer-guide/users
---

# Users

Users define the initial user accounts created when a profile is installed. They are defined in a `users.json` file placed in a profile's directory and are automatically loaded during seeding.

## Structure

```json
{
  "purge": false,
  "users": []
}
```

| Field   | Type      | Description                                                                  |
| ------- | --------- | ---------------------------------------------------------------------------- |
| `purge` | `boolean` | When `true`, all existing users are deleted before importing from this file. |
| `users` | `array`   | List of user definitions to create.                                          |

### User items

Each item in the `users` array has:

| Field      | Type     | Description                                                |
| ---------- | -------- | ---------------------------------------------------------- |
| `id`       | `string` | Unique username or user ID.                                |
| `password` | `string` | Plain text password (hashed automatically during seeding). |
| `fullname` | `string` | Full display name.                                         |
| `email`    | `string` | Email address.                                             |
| `roles`    | `array`  | List of role IDs to assign (e.g. `["Administrator"]`).     |
| `groups`   | `array`  | Optional list of group IDs to assign.                      |

Any additional fields (e.g. `location`, `description`) are stored as extra metadata on the user.

## Example

Place a file like `src/profiles/default/users.json`:

```json
{
  "users": [
    {
      "id": "jane",
      "password": "s3cret",
      "fullname": "Jane Doe",
      "email": "jane@example.com",
      "roles": ["Editor"],
      "description": "Content editor"
    }
  ]
}
```

The file is picked up automatically during seeding — no manual registration is required. When `purge` is `false` or omitted, new users are added without removing existing ones.
