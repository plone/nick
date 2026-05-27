---
title: Events
parent: Developer guide
permalink: /developer-guide/events
---

# Events

The event system lets you hook into lifecycle events and run custom logic. Events are registered in a profile using the event registry.

## Event plugin interface

An event plugin is an object where each key is an event name and each value is an async handler function:

```ts
type EventHandler = (
  document: any,
  user: any,
  trx: Knex.Transaction,
  ...params: any[]
) => Promise<void>;

interface EventPlugin {
  [eventName: string]: EventHandler;
}
```

## Available events

### Content events

| Event             | When                     | Extra params                    |
| ----------------- | ------------------------ | ------------------------------- |
| `onBeforeAdd`     | Before creating content  | `parentDocument`, `json`        |
| `onAfterAdd`      | After creating content   | `req`, `parentDocument`, `json` |
| `onBeforeModify`  | Before modifying content | `{ ...json, id, path }`         |
| `onAfterModified` | After modifying content  | `req`                           |
| `onBeforeCopy`    | Before copying content   | —                               |
| `onAfterCopy`     | After copying content    | `source`                        |
| `onAfterMove`     | After moving content     | `source`                        |
| `onBeforeDelete`  | Before deleting content  | —                               |
| `onAfterDelete`   | After deleting content   | `parentDocument`                |

### Workflow events

| Event                    | When                       | Extra params                    |
| ------------------------ | -------------------------- | ------------------------------- |
| `onBeforeChangeWorkflow` | Before workflow transition | `transition`, `newState`        |
| `onAfterChangeWorkflow`  | After workflow transition  | `req`, `transition`, `oldState` |

### User events

| Event                | When                   | Extra params |
| -------------------- | ---------------------- | ------------ |
| `onAfterAddUser`     | After creating a user  | —            |
| `onAfterUpdateUser`  | After updating a user  | —            |
| `onBeforeDeleteUser` | Before deleting a user | —            |
| `onAfterDeleteUser`  | After deleting a user  | —            |

### Group events

| Event                 | When                    | Extra params |
| --------------------- | ----------------------- | ------------ |
| `onAfterAddGroup`     | After creating a group  | —            |
| `onAfterUpdateGroup`  | After updating a group  | —            |
| `onBeforeDeleteGroup` | Before deleting a group | `groupId`    |
| `onAfterDeleteGroup`  | After deleting a group  | `groupId`    |

### Authentication events

| Event      | When      | Extra params |
| ---------- | --------- | ------------ |
| `onLogin`  | On login  | —            |
| `onLogout` | On logout | —            |

## Creating an event plugin

Create a file that exports an event plugin object, for example `src/events/my-custom/my-custom.ts`:

```ts
export const myEvents = {
  onAfterAdd: async (
    document: any,
    user: any,
    trx: any,
    req: any,
    parentDocument: any,
    json: any,
  ) => {
    // Your custom logic here
    console.log(`Document ${document.path} was created by ${user.id}`);
  },
  onAfterDelete: async (document: any, user: any, trx: any) => {
    // Your custom logic here
    console.log(`Document ${document.path} was deleted`);
  },
};
```

## Registering the plugin

In a profile file (e.g. `src/profiles/core/index.ts`), import and register your event plugin:

```ts
import events from '../../events';
import { myEvents } from '../../events/my-custom/my-custom';

// In your init() function:
events.register(myCustom);
```
