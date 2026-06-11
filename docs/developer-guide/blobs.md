---
title: Blobs
parent: Developer guide
permalink: /developer-guide/blobs
---

# Blobs

Blobs (Binary Large Objects) — uploaded files, images, documents — are stored through a pluggable backend system. A central registry maps backend names to handler objects, and a configuration value selects which backend is active at runtime.

The built-in backends are `file` (local filesystem), `db` (PostgreSQL), and `s3` (S3-compatible object storage). You can add custom backends by implementing the `BlobHandler` contract and registering them.

## BlobHandler contract

Each backend must be an object with four methods:

```ts
type BlobHandler = {
  read: (uuid: string, trx: Knex.Transaction) => Promise<Buffer>;
  store: (uuid: string, data: Buffer, trx?: Knex.Transaction) => Promise<void>;
  remove: (uuid: string, trx: Knex.Transaction) => Promise<void>;
  copy: (
    source: string,
    target: string,
    trx?: Knex.Transaction,
  ) => Promise<void>;
};
```

| Method   | Description                                           |
| -------- | ----------------------------------------------------- |
| `read`   | Return the blob data as a `Buffer` by UUID.           |
| `store`  | Persist `data` under the given UUID.                  |
| `remove` | Delete the blob identified by UUID.                   |
| `copy`   | Duplicate a blob from `source` UUID to `target` UUID. |

The `trx` parameter is a [Knex transaction](https://knexjs.org/guide/transactions.html). Backends that do not participate in database transactions (e.g. filesystem, S3) should accept but ignore it (convention: name the parameter `_trx`).

## Creating a backend

Create a file that exports a `BlobHandler` object. Here is a minimal example that stores blobs in-memory (useful for testing):

```ts
// src/blobs/memory/memory.ts
import type { Knex } from 'knex';

const store = new Map<string, Buffer>();

export const memory = {
  read: async (uuid: string, _trx: Knex.Transaction): Promise<Buffer> => {
    const data = store.get(uuid);
    if (!data) throw `Blob not found: ${uuid}`;
    return data;
  },

  store: async (
    uuid: string,
    data: Buffer,
    _trx?: Knex.Transaction,
  ): Promise<void> => {
    store.set(uuid, data);
  },

  remove: async (uuid: string, _trx: Knex.Transaction): Promise<void> => {
    store.delete(uuid);
  },

  copy: async (
    source: string,
    target: string,
    _trx?: Knex.Transaction,
  ): Promise<void> => {
    const data = store.get(source);
    if (!data) throw `Blob not found: ${source}`;
    store.set(target, Buffer.from(data));
  },
};
```

## Registration

In your profile's `init()` function, import the `blobs` registry and your handler, then register it with a name:

```ts
import blobs from '@plone/nick/src/blobs';
import { memory } from '../../blobs/memory/memory';

// In init():
blobs.register('memory', memory);
```

## Selection

The active backend is chosen at runtime by the value of `config.settings.blobs`. Set it in your project's `config.ts`:

```ts
export const config = {
  blobs: 'memory',
  // ...
};
```

At startup, all registered backends are available. The facade in `src/helpers/fs/fs.ts` resolves the active one:

```
config.settings.blobs ──> blobs.get(name) ──> handler.read / store / remove / copy
```

## Built-in implementations

Reference implementations live under [`src/blobs/`](https://github.com/plone/nick/tree/main/src/blobs):

| Name   | File                     | Storage                    |
| ------ | ------------------------ | -------------------------- |
| `file` | `src/blobs/file/file.ts` | Filesystem (`blobsDir`/)   |
| `db`   | `src/blobs/db/db.ts`     | PostgreSQL `file` table    |
| `s3`   | `src/blobs/s3/s3.ts`     | S3-compatible object store |

See the [admin guide](/admin-guide/blobs) for configuration details of each backend.
