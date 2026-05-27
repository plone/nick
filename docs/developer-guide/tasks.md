---
title: Tasks
parent: Developer guide
permalink: /developer-guide/tasks
---

# Tasks

Scheduled tasks run recurring operations using cron-style expressions. Tasks are registered in a profile and executed at startup via `node-cron`.

## Task interface

```ts
type Task = {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
};
```

## Creating a task

Create a file that exports a `Task` object:

```ts
// src/tasks/my-task/my-task.ts
import type { Task } from '../../types';

export const myTask: Task = {
  name: 'My Task',
  schedule: '0 * * * *', // every hour
  handler: async () => {
    // Your recurring logic here
  },
};
```

The `schedule` field uses standard cron format:

```
* * * * * *
| | | | | |
| | | | | +-- Day of the Week   (0-7, 0 or 7 is Sunday)
| | | | +---- Month             (1-12)
| | | +------ Day of the Month  (1-31)
| | +-------- Hour              (0-23)
| +---------- Minute            (0-59)
+------------ Second            (0-59, optional)
```

## Registration

In a profile's `init()` function, import and register the task:

```ts
import tasks from '../../tasks';
import { myTask } from '../../tasks/my-task/my-task';

// In init():
tasks.register(myTask);
```

Tasks are automatically scheduled when the application starts via `tasks.run()` in `src/app.ts`.
