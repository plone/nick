---
title: Workflows
parent: Developer guide
permalink: /developer-guide/workflows
---

# Workflows

Workflows define the review and publication states that content can move through. They are defined in a `workflows.json` file placed in a profile's directory and are automatically loaded when the profile is installed.

## Structure

```json
{
  "purge": true,
  "workflows": []
}
```

| Field       | Type      | Description                                                                      |
| ----------- | --------- | -------------------------------------------------------------------------------- |
| `purge`     | `boolean` | When `true`, all existing workflows are deleted before importing from this file. |
| `workflows` | `array`   | List of workflow definitions to create or update.                                |

### Workflow items

Each item in the `workflows` array has:

| Field              | Type     | Description                                                                |
| ------------------ | -------- | -------------------------------------------------------------------------- |
| `id`               | `string` | Unique identifier for the workflow (e.g. `"simple_publication_workflow"`). |
| `title:i18n`       | `string` | Display title.                                                             |
| `description:i18n` | `string` | Description of the workflow.                                               |
| `json`             | `object` | The workflow definition containing states and transitions.                 |

### The `json` object

| Field           | Type     | Description                                             |
| --------------- | -------- | ------------------------------------------------------- |
| `initial_state` | `string` | The state ID that content starts in when first created. |
| `states`        | `object` | A map of state IDs to their definitions.                |
| `transitions`   | `object` | A map of transition IDs to their definitions.           |

#### State definition

| Field              | Type     | Description                                                          |
| ------------------ | -------- | -------------------------------------------------------------------- |
| `title:i18n`       | `string` | Display label for the state.                                         |
| `description:i18n` | `string` | Description of the state.                                            |
| `transitions`      | `array`  | Transition IDs available from this state.                            |
| `permissions`      | `object` | A map of role IDs to arrays of permission IDs granted in this state. |

#### Transition definition

| Field        | Type     | Description                                                         |
| ------------ | -------- | ------------------------------------------------------------------- |
| `title:i18n` | `string` | Display label for the transition.                                   |
| `new_state`  | `string` | The state ID the content moves to when this transition is executed. |
| `permission` | `string` | The permission required to execute this transition.                 |

If a workflow with the same `id` already exists, it is updated (merged) with the new definition.

## Example

Place a file like `src/profiles/default/workflows.json`:

```json
{
  "workflows": [
    {
      "id": "my_workflow",
      "title:i18n": "My Workflow",
      "description:i18n": "Description of the workflow.",
      "json": {
        "initial_state": "draft",
        "states": {
          "draft": {
            "title:i18n": "Draft",
            "description:i18n": "Content is not yet visible.",
            "transitions": ["publish"],
            "permissions": {
              "Editor": ["View", "Modify"],
              "Administrator": ["View", "Modify"]
            }
          },
          "published": {
            "title:i18n": "Published",
            "description:i18n": "Visible to everyone.",
            "transitions": ["retract"],
            "permissions": {
              "Anonymous": ["View"],
              "Editor": ["Modify"],
              "Administrator": ["Modify"]
            }
          }
        },
        "transitions": {
          "publish": {
            "title:i18n": "Publish",
            "new_state": "published",
            "permission": "Review"
          },
          "retract": {
            "title:i18n": "Retract",
            "new_state": "draft",
            "permission": "Submit"
          }
        }
      }
    }
  ]
}
```

The file is picked up automatically during seeding — no manual registration is required. When `purge` is `false` or omitted, new workflows are added and existing ones are merged.
