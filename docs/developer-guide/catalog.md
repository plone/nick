---
title: Catalog
parent: Developer guide
permalink: /developer-guide/catalog
---

# Catalog

The catalog defines indexes and metadata columns for searching and listing content. They are defined in a `catalog.json` file placed in a profile's directory and are automatically loaded when the profile is installed.

## Structure

```json
{
  "indexes": [],
  "metadata": []
}
```

| Field      | Type    | Description                                                                  |
| ---------- | ------- | ---------------------------------------------------------------------------- |
| `indexes`  | `array` | Searchable and sortable columns that can be used in queries.                 |
| `metadata` | `array` | Additional columns stored alongside indexes for retrieval in search results. |

### Index items

Each entry in the `indexes` array is a column on the `catalog` database table that enables searching, filtering, and sorting.

| Field              | Type      | Description                                                                                                                      |
| ------------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `name`             | `string`  | Column name (prefixed with `_` in the database).                                                                                 |
| `type`             | `string`  | Data type: `"string"`, `"integer"`, `"path"`, `"uuid"`, `"boolean"`, `"date"`, `"string[]"`, `"uuid[]"`, `"embed"`, or `"text"`. |
| `attr`             | `string`  | The document attribute or method name to index (e.g. `"getTitle"`, `"description"`, `"workflow_state"`).                         |
| `title:i18n`       | `string`  | Optional display label.                                                                                                          |
| `description:i18n` | `string`  | Optional description.                                                                                                            |
| `group`            | `string`  | Optional UI grouping category (e.g. `"Metadata"`, `"Dates"`, `"Text"`).                                                          |
| `enabled`          | `boolean` | Whether the index is active and available in queries.                                                                            |
| `sortable`         | `boolean` | Whether results can be sorted by this index.                                                                                     |
| `operators`        | `object`  | Optional map of operator IDs to their definitions (title, description, operation, widget) for building query filters.            |
| `vocabulary`       | `string`  | Optional vocabulary reference for autocomplete in the UI (e.g. `"users"`, `"types"`).                                            |

### Metadata items

Each entry in the `metadata` array is an additional column that is populated when catalog entries are updated, making the value available in search results without looking up the document.

| Field  | Type     | Description                                                                                               |
| ------ | -------- | --------------------------------------------------------------------------------------------------------- |
| `name` | `string` | Column name used when retrieving metadata.                                                                |
| `type` | `string` | Data type: `"string"`, `"integer"`, `"uuid"`, `"boolean"`, `"date"`, `"json"`, `"string[]"`, or `"text"`. |
| `attr` | `string` | The document attribute or method to read the value from.                                                  |

### Operators

An operator defines how an index can be filtered in queries. Each key under `operators` has:

| Field              | Type     | Description                                                                                                               |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `title:i18n`       | `string` | Display label.                                                                                                            |
| `description:i18n` | `string` | Help text shown to the user.                                                                                              |
| `operation`        | `string` | Internal operation identifier handled by the query system (e.g. `"contains"`, `"equal"`, `"largerThan"`, `"afterToday"`). |
| `widget`           | `string` | UI widget for input (e.g. `"StringWidget"`, `"DateWidget"`, `"MultipleSelectionWidget"`, `"ReferenceWidget"`).            |

## Example

Place a file like `src/profiles/default/catalog.json`:

```json
{
  "indexes": [
    {
      "name": "my_field",
      "type": "string",
      "attr": "myField",
      "title:i18n": "My Field",
      "group": "Metadata",
      "enabled": true,
      "sortable": true,
      "operators": {
        "string.is": {
          "title:i18n": "Is",
          "operation": "equal",
          "widget": "StringWidget"
        }
      }
    }
  ],
  "metadata": [
    {
      "name": "my_field",
      "type": "string",
      "attr": "myField"
    }
  ]
}
```

The file is picked up automatically during seeding — no manual registration is required. New columns are added to the `catalog` database table alongside the existing ones.
