---
title: Content rules
parent: Developer guide
permalink: /developer-guide/content-rules
---

# Content rules

Content rules let users define automated reactions to lifecycle events. Actions perform side effects when a rule triggers, while conditions gate whether a rule's actions execute.

## Interfaces

### Action

```ts
interface ContentRuleAction {
  getTitle(req: Request): string;
  getDescription(req: Request): string;
  getSummary(req: Request, params: Params): string;
  schema: Json;
  handler(
    params: Params,
    context: any,
    user: any,
    contentRule: any,
    trx: Knex.Transaction,
  ): Promise<void>;
}
```

### Condition

```ts
interface ContentRuleCondition {
  getTitle(req: Request): string;
  getDescription(req: Request): string;
  getSummary(req: Request, params: Params): string;
  schema: Json;
  handler(
    params: Params,
    context: any,
    user: any,
    contentRule: any,
    trx: Knex.Transaction,
  ): Promise<boolean>;
}
```

The key difference: an **action handler** returns `void` (it performs side effects), while a **condition handler** returns `boolean` (it evaluates a predicate).

Both require metadata methods (`getTitle`, `getDescription`, `getSummary`) and a `schema` for the rule configuration UI.

## Creating an action

```ts
// src/content_rules/actions/my-action/my-action.ts
import type { Params, Request } from '../../types';
import { Knex } from 'knex';

export const myAction = {
  getTitle: (req: Request) => req.i18n('My Action'),
  getDescription: (req: Request) =>
    req.i18n('Description of what this action does'),
  getSummary: (req: Request, params: Params) =>
    req.i18n('My action with param {field}', {
      field: params.field || req.i18n('None'),
    }),
  schema: {
    fieldsets: [{ fields: ['field'], id: 'default', title: 'Default' }],
    properties: {
      field: {
        title: 'My Field',
        type: 'string',
      },
    },
    required: ['field'],
    type: 'object',
  },
  handler: async (
    params: Params,
    document: any,
    user: any,
    contentRule: any,
    trx: Knex.Transaction,
  ): Promise<void> => {
    // Your action logic here
  },
};
```

## Creating a condition

```ts
// src/content_rules/conditions/my-condition/my-condition.ts
import type { Params, Request } from '../../types';

export const myCondition = {
  getTitle: (req: Request) => req.i18n('My Condition'),
  getDescription: (req: Request) =>
    req.i18n('Description of what this condition checks'),
  getSummary: (req: Request, params: Params) =>
    req.i18n('My condition: {field}', {
      field: params.field || req.i18n('None'),
    }),
  schema: {
    fieldsets: [{ fields: ['field'], id: 'default', title: 'Default' }],
    properties: {
      field: {
        title: 'My Field',
        type: 'string',
      },
    },
    required: ['field'],
    type: 'object',
  },
  handler: async (
    params: Params,
    document: any,
    user: any,
    contentRule: any,
    trx: Knex.Transaction,
  ): Promise<boolean> => {
    // Return true if the condition passes
    return params.field === document.someValue;
  },
};
```

## Registration

In a profile's `init()` function:

```ts
import contentRules from '../../content_rules';
import { myAction } from '../../content_rules/actions/my-action/my-action';
import { myCondition } from '../../content_rules/conditions/my-condition/my-condition';

// In init():
contentRules.registerAction('myAction', myAction);
contentRules.registerCondition('myCondition', myCondition);
```

When a content rule is evaluated, all conditions are checked (AND logic — all must pass), and if they do, all actions execute in sequence.

## Initial content rules via profile

You can seed initial content rules by placing a `content_rules.json` file in a profile's directory. The file is automatically loaded when the profile is installed.

```json
{
  "purge": true,
  "content_rules": []
}
```

| Field           | Type      | Description                                                           |
| --------------- | --------- | --------------------------------------------------------------------- |
| `purge`         | `boolean` | When `true`, all existing content rules are deleted before importing. |
| `content_rules` | `array`   | List of content rule definitions to create.                           |

### Content rule items

| Field         | Type      | Description                                                                                                                                    |
| ------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | `string`  | Unique identifier for the rule.                                                                                                                |
| `title`       | `string`  | Display title.                                                                                                                                 |
| `description` | `string`  | Description of what the rule does.                                                                                                             |
| `event`       | `string`  | The lifecycle event that triggers the rule (e.g. `"onAfterAdd"`, `"onAfterDelete"`).                                                           |
| `enabled`     | `boolean` | Whether the rule is active.                                                                                                                    |
| `cascading`   | `boolean` | Whether the rule applies to subfolders.                                                                                                        |
| `stop`        | `boolean` | Whether to stop processing further rules after this one.                                                                                       |
| `actions`     | `array`   | List of actions to execute. Each action has a `type` (e.g. `"transition_workflow"`, `"logger"`) and its configuration parameters.              |
| `conditions`  | `array`   | List of conditions that must pass. Each condition has a `type` (e.g. `"file_extension"`, `"workflow_state"`) and its configuration parameters. |

### Example

Place a file like `src/profiles/default/content_rules.json`:

```json
{
  "content_rules": [
    {
      "id": "auto-publish-images",
      "title": "Auto-publish images",
      "event": "onAfterAdd",
      "enabled": true,
      "cascading": true,
      "stop": false,
      "actions": [
        {
          "type": "transition_workflow",
          "transition": "publish"
        }
      ],
      "conditions": [
        {
          "type": "file_extension",
          "file_extension": "jpg"
        }
      ]
    }
  ]
}
```

The file is picked up automatically during seeding — no manual registration is required. When `purge` is `false` or omitted, new rules are added without removing existing ones.
