---
title: Types
parent: Developer guide
permalink: /developer-guide/types
---

# Types

Types define the content types available in the system. Each type is defined by a JSON file placed in a profile's `types/` directory and is automatically loaded when the profile is installed.

## Structure

A type JSON file has the following top-level fields:

| Field                   | Type      | Default | Description                                                                                 |
| ----------------------- | --------- | ------- | ------------------------------------------------------------------------------------------- |
| `id`                    | `string`  | —       | Unique identifier for the type (e.g. `"Page"`, `"Event"`).                                  |
| `title:i18n`            | `string`  | —       | Display name (the `:i18n` suffix enables translation).                                      |
| `description:i18n`      | `string`  | `""`    | Optional description.                                                                       |
| `global_allow`          | `boolean` | —       | Whether the type can be created globally.                                                   |
| `filter_content_types`  | `boolean` | —       | When `true`, only types listed in `allowed_content_types` can be added as children.         |
| `allowed_content_types` | `array`   | —       | List of type IDs allowed as children (only used when `filter_content_types` is `true`).     |
| `schema`                | `object`  | —       | Schema definition including behaviors, fieldsets, properties, required fields, and layouts. |
| `workflow`              | `string`  | —       | Default workflow ID for content of this type.                                               |

### Schema

The `schema` object accepts:

- **`behaviors`** — An array of behavior IDs that this type uses. Behaviors add methods and schema fields to the type at runtime (see [Behaviors](/developer-guide/behaviors)).
- **`fieldsets`** — An array of groups that organize custom fields into UI sections. Each fieldset has an `id`, a `title:i18n`, and a `fields` array listing the property keys it contains.
- **`properties`** — A map of custom field names to their JSON Schema definitions. Each property specifies a `type` (`string`, `boolean`, `integer`, `array`, `object`), `title:i18n`, optional `description:i18n`, `default`, `widget` (e.g. `"textarea"`, `"file"`, `"datetime"`, `"url"`), and `factory` (e.g. `"Text line (String)"`, `"Yes/No"`, `"Date/Time"`, `"Choice"`, `"Tuple"`).
- **`required`** — An array of custom field names that must have a value.
- **`layouts`** — An array of layout IDs available for rendering this type.

## Example

Place a file like `src/profiles/default/types/mytype.json`:

```json
{
  "id": "MyType",
  "title:i18n": "My Type",
  "global_allow": true,
  "filter_content_types": false,
  "allowed_content_types": [],
  "schema": {
    "behaviors": [
      "dublin_core",
      "dates",
      "versioning",
      "short_name",
      "id_from_title",
      "exclude_from_nav"
    ],
    "layouts": []
  },
  "workflow": "simple_publication_workflow"
}
```

To add custom fields, include `fieldsets`, `properties`, and `required` in the schema:

```json
{
  "id": "MyType",
  "title:i18n": "My Type",
  "global_allow": true,
  "filter_content_types": false,
  "allowed_content_types": [],
  "schema": {
    "fieldsets": [
      {
        "fields": ["headline", "published"],
        "id": "default",
        "title:i18n": "Default"
      }
    ],
    "properties": {
      "headline": {
        "title:i18n": "Headline",
        "type": "string"
      },
      "published": {
        "title:i18n": "Published",
        "description:i18n": "When this content was published.",
        "type": "string",
        "widget": "datetime",
        "factory": "Date/Time"
      }
    },
    "required": ["headline"],
    "behaviors": ["dublin_core", "versioning"],
    "layouts": []
  },
  "workflow": "simple_publication_workflow"
}
```

The file is picked up automatically during seeding — no manual registration is required.
