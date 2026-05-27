---
title: Routes
parent: Developer guide
permalink: /developer-guide/routes
---

# Routes

Routes define API endpoints. Each route consists of a handler function and a configuration object specifying the HTTP method, URL pattern, permission, and cache policy.

## Route interface

```ts
interface Route {
  view: string;
  op: 'get' | 'post' | 'put' | 'delete' | 'patch';
  permission: string;
  client?: string;
  cache:
    | 'alter'
    | 'manage'
    | 'dynamic'
    | 'content'
    | 'resource'
    | 'stable'
    | 'static';
  middleware?: any;
  handler?: (req: Request, trx: Knex.Transaction) => Promise<View>;
}
```

**`view`** — The URL path suffix appended to the document path. Use `''` to match the document itself, or `'/@name'` for sub-endpoints.

**`op`** — The HTTP method.

**`permission`** — The permission required to access this route (e.g. `'View'`, `'Modify'`, `'Add'`). Checked by `callHandler` after resolving user roles and workflow state.

**`client`** — Optional name that auto-generates a method on the programmatic `Client` class.

**`cache`** — Designates a caching policy from the config's `cache.policies`.

**`middleware`** — Optional Express middleware (e.g. a rate limiter or custom JSON body size limit).

## View response interface

```ts
interface View {
  status?: number;
  etag?: string;
  xkeys?: string[];
  json?: any;
  html?: string;
  headers?: { [key: string]: string };
  binary?: Buffer;
}
```

Return `{ json: ... }` for JSON APIs, `{ status: 204 }` for empty responses, `{ binary: buffer, headers: {...} }` for file downloads, or `{ html: '...' }` for HTML responses.

## Creating a route

Create a file that exports a handler function and a default array of route objects:

```ts
// src/routes/my-route/my-route.ts
import type { Knex } from 'knex';
import type { Request, View } from '../../types';

const handler = async (req: Request, trx: Knex.Transaction): Promise<View> => {
  // Your route logic here
  return { json: { message: 'Hello' } };
};

export default [
  {
    op: 'get',
    view: '/@my-route',
    permission: 'View',
    client: 'getMyRoute',
    cache: 'content',
    handler,
  },
];
```

The `req` object provides access to the traversed document (`req.document`), the authenticated user (`req.user`), the content type (`req.type`), resolved permissions (`req.permissions`), query parameters (`req.query`), URL params (`req.params`), and request body (`req.body`).

## Registration

In a profile's `init()` function, import and register the route:

```ts
import routes from '../../routes';
import myRoute from '../../routes/my-route/my-route';

// In init():
routes.register(myRoute);
```

Routes are prepended to the registry.
