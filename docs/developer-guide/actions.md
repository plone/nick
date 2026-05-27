---
title: Actions
parent: Developer guide
permalink: /developer-guide/actions
---

# Actions

Actions define the available actions and buttons throughout the site. They are defined in an `actions.json` file placed in a profile's directory and are automatically loaded when the profile is installed.

## Structure

```json
{
  "purge": true,
  "object": [],
  "object_buttons": [],
  "site_actions": [],
  "user": []
}
```

### Top-level fields

| Field            | Type      | Description                                                                                                                             |
| ---------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `purge`          | `boolean` | When `true`, all existing actions are deleted before importing from this file. Use this in a core profile to establish the initial set. |
| `object`         | `array`   | Actions shown on content objects (e.g. View, Edit, History).                                                                            |
| `object_buttons` | `array`   | Buttons shown on content objects (e.g. Cut, Copy, Delete).                                                                              |
| `site_actions`   | `array`   | Actions available site-wide (e.g. Sitemap, Contact).                                                                                    |
| `user`           | `array`   | User-related actions visible in the personal tools menu (e.g. Preferences, Log in, Log out).                                            |

### Action items

Each item in these arrays has:

| Field        | Type     | Description                                                                                       |
| ------------ | -------- | ------------------------------------------------------------------------------------------------- |
| `id`         | `string` | Unique identifier for the action.                                                                 |
| `title:i18n` | `string` | Display label (the `:i18n` suffix enables translation).                                           |
| `permission` | `string` | The permission required to see or use the action (e.g. `"View"`, `"Modify"`, `"Add"`, `"Login"`). |

Actions appear in the order they are listed in the array. To specify an explicit ordering, add an `order` field with a number.

## Example

Place a file like `src/profiles/default/actions.json`:

```json
{
  "object": [
    {
      "id": "myAction",
      "title:i18n": "My Action",
      "permission": "View"
    }
  ],
  "site_actions": [
    {
      "id": "myLink",
      "title:i18n": "My Link",
      "permission": "View"
    }
  ]
}
```

The file is picked up automatically during seeding — no manual registration is required. When `purge` is `false` or omitted, the actions are added to the existing set rather than replacing it.
