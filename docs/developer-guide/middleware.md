---
title: Middleware
parent: Developer guide
permalink: /developer-guide/middleware
---

# Middleware

Middleware functions run on every request before the route handler. They can modify the request or response, set headers, perform logging, or attach utilities to the request object.

## Middleware interface

```ts
type MiddlewareHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;
```

Middleware can also be async:

```ts
type MiddlewareHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;
```

## Creating middleware

Create a file that exports a standard Express middleware function:

```ts
// src/middleware/my-middleware/my-middleware.ts
import type { Request } from '../../types';
import { NextFunction, Response } from 'express';

export function myMiddleware(req: Request, res: Response, next: NextFunction) {
  // Modify request, set headers, or run side effects
  next();
}
```

For async middleware (e.g. fetching data from the database), use an async function:

```ts
import type { Request } from '../../types';
import { NextFunction, Response } from 'express';
import models from '../../models';

export async function myMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const Setting = models.get('Setting');
  const setting = await Setting.fetchById('my-setting', {}, req.trx);
  req.mySetting = setting;
  next();
}
```

## Registration

In a profile's `init()` function, import and register the middleware:

```ts
import middleware from '../../middleware';
import { myMiddleware } from '../../middleware/my-middleware/my-middleware';

// In init():
middleware.register(myMiddleware);
```

All registered middleware is mounted globally via `middleware.use(app)` in `src/app.ts`, which calls `app.use(handler)` for each handler.

## Per-route middleware

For middleware that should only apply to specific routes (e.g. rate limiters), use the `middleware` field on the route definition instead of the global registry.
