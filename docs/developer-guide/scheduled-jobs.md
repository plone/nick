---
title: Scheduled jobs
parent: Developer guide
permalink: /developer-guide/scheduled-jobs
---

# Scheduled jobs

Scheduled job actions define tasks that run on a recurring schedule. They are registered programmatically in a profile's `index.ts` using the scheduled jobs registry.

## Structure

A scheduled job action is an object that conforms to the `ScheduledJobAction` interface:

| Method / Field                | Description                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| `getTitle(req)`               | Returns the display title for the action.                     |
| `getDescription(req)`         | Returns a short description shown in the UI.                  |
| `getSummary(req, params)`     | Returns a summary of the action's parameters for display.     |
| `schema`                      | A JSON schema defining the action's configuration parameters. |
| `handler(params, actor, trx)` | The async function that executes the action.                  |

### `handler`

The handler receives three arguments:

- `params` — The configuration parameters filled in by the user, validated against the `schema`.
- `actor` — The ID of the user triggering the job.
- `trx` — A Knex transaction that should be used for all database operations.

It should return an object (e.g. `{ status: 'success' }`).

## Creating an action

```ts
// src/scheduled_jobs/actions/my-action.ts
import type { Params, Request } from '../../types';
import { Knex } from 'knex';

export const myAction = {
  getTitle: (req) => req.i18n('My action'),
  getDescription: (req) => req.i18n('Description of my action'),
  getSummary: (req, params) =>
    req.i18n('My action with {param}', { param: params.param }),
  schema: {
    type: 'object',
    properties: {
      param: {
        type: 'string',
        title: 'My parameter',
      },
    },
    required: ['param'],
  },
  handler: async (
    params: Params,
    actor: any,
    trx: Knex.Transaction,
  ): Promise<any> => {
    // Perform the scheduled job logic here
    return { status: 'success' };
  },
};
```

## Registration

Place the registration in your profile's `index.ts`:

```ts
import scheduledJobs from '../../scheduled_jobs';
import { myAction } from '../../scheduled_jobs/actions/my-action';

// In init():
scheduledJobs.registerAction('myAction', myAction);
```

The action will appear in the scheduled jobs UI once the profile is loaded, and users can configure and schedule it.

## Creating a scheduled job in a profile

Define pre-configured scheduled jobs in a `scheduled_jobs.json` file placed in your profile's directory. These are picked up automatically during seeding.

```json
{
  "purge": false,
  "scheduled_jobs": [
    {
      "id": "my-scheduled-job",
      "title": "My Scheduled Job",
      "description": "Description of my scheduled job",
      "action": "myAction",
      "params": {
        "param": "value"
      },
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Fields

| Field            | Type      | Description                                                            |
| ---------------- | --------- | ---------------------------------------------------------------------- |
| `purge`          | `boolean` | When `true`, all existing scheduled jobs are deleted before importing. |
| `scheduled_jobs` | `array`   | A list of scheduled jobs to create.                                    |

### Scheduled job items

| Field         | Type     | Description                                                               |
| ------------- | -------- | ------------------------------------------------------------------------- |
| `id`          | `string` | Unique identifier for the scheduled job. Defaults to `scheduled-job-{n}`. |
| `title`       | `string` | Display title. Defaults to `Scheduled Job {n}`.                           |
| `description` | `string` | A short description.                                                      |
| `action`      | `string` | The name of the registered action (e.g. `reindex`, `myAction`).           |
| `params`      | `object` | Configuration parameters passed to the action's handler.                  |
| `schedule`    | `string` | A cron expression defining the run schedule. Defaults to `0 0 * * *`.     |

Place the file at `src/profiles/{your-profile}/scheduled_jobs.json`. The schedule uses standard cron syntax — in the example above, `0 0 * * *` runs daily at midnight.
