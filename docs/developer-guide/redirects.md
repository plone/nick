---
title: Redirects
parent: Developer guide
permalink: /developer-guide/redirects
---

# Redirects

Redirects map old or alternative URL paths to content documents. They are defined in a `redirects.json` file placed in a profile's directory and are automatically loaded when the profile is installed.

## Structure

```json
{
  "purge": true,
  "redirects": []
}
```

| Field       | Type      | Description                                                                      |
| ----------- | --------- | -------------------------------------------------------------------------------- |
| `purge`     | `boolean` | When `true`, all existing redirects are deleted before importing from this file. |
| `redirects` | `array`   | List of redirect definitions to create.                                          |

### Redirect items

Each item in the `redirects` array has:

| Field      | Type      | Description                                                                                                  |
| ---------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| `path`     | `string`  | The source URL path that should be redirected.                                                               |
| `document` | `string`  | The UUID of the target document to redirect to.                                                              |
| `manual`   | `boolean` | Whether this is a manually created redirect. Auto-redirects are created when a document is moved or renamed. |
| `datetime` | `string`  | ISO 8601 timestamp of when the redirect was created.                                                         |

## Example

Place a file like `src/profiles/default/redirects.json`:

```json
{
  "redirects": [
    {
      "path": "/old-page",
      "document": "some-uuid-of-a-document",
      "manual": true,
      "datetime": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

The file is picked up automatically during seeding — no manual registration is required. When `purge` is `false` or omitted, the redirects are added to the existing set rather than replacing it.
