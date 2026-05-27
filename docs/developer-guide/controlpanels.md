---
title: Controlpanels
parent: Developer guide
permalink: /developer-guide/controlpanels
---

# Controlpanels

Controlpanels provide site-wide configuration forms. Each controlpanel is defined by a JSON file placed in a profile's `controlpanels/` directory and is automatically loaded into the database when the profile is installed.

## Structure

A controlpanel JSON file has the following top-level fields:

| Field        | Type     | Description                                                                      |
| ------------ | -------- | -------------------------------------------------------------------------------- |
| `id`         | `string` | Unique identifier for the controlpanel.                                          |
| `title:i18n` | `string` | Display title (the `:i18n` suffix enables translation).                          |
| `group`      | `string` | Category in the UI. One of `"General"`, `"Content"`, `"Security"`, or `"Users"`. |
| `schema`     | `object` | JSON Schema defining the form fields, fieldsets, and validation.                 |
| `data`       | `object` | Default values for each field.                                                   |

### Schema

The `schema` object contains:

- **`fieldsets`** — An array of groups that organize fields into UI sections. Each fieldset has an `id`, a `title:i18n`, and a `fields` array listing the property keys it contains.
- **`properties`** — A map of field names to their JSON Schema definitions. Each property can specify:
  - `type` — `"string"`, `"boolean"`, `"integer"`, `"array"`, or `"object"`.
  - `title:i18n`, `description:i18n` — Display labels.
  - `default` — Default value.
  - `widget` — Custom display widget such as `"textarea"`, `"password"`, `"file"`, or `"object_list"`.
  - `factory` — For complex types: `"Choice"` (dropdown) or `"Image"` (image picker).
  - `vocabulary` — A vocabulary reference for choice fields, e.g. `{ "@id": "supportedLanguages" }`.
  - `items` — Schema for array item types.
  - `schema` — Nested schema for object properties.
  - `uniqueItems`, `additionalItems` — Array validation options.
- **`required`** — An array of field names that must have a value.

### Data

The `data` object maps each field name to its default value. These values are used when the controlpanel is first installed.

## Example

Place a file like `src/profiles/default/controlpanels/myfeature.json`:

```json
{
  "id": "myfeature",
  "title:i18n": "My Feature",
  "group": "Content",
  "schema": {
    "fieldsets": [
      {
        "fields": ["setting_one", "setting_two"],
        "id": "default",
        "title:i18n": "Default"
      }
    ],
    "properties": {
      "setting_one": {
        "title:i18n": "Setting One",
        "description:i18n": "Description of the first setting.",
        "type": "string"
      },
      "setting_two": {
        "title:i18n": "Setting Two",
        "description:i18n": "Description of the second setting.",
        "type": "boolean",
        "default": true
      }
    },
    "required": []
  },
  "data": {
    "setting_one": "",
    "setting_two": true
  }
}
```

The file is picked up automatically during seeding — no manual registration is required. The controlpanel will appear in the admin UI under its assigned group and is accessible via `GET /@controlpanels/:id`.
