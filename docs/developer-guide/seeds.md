---
title: Seeds
parent: Developer guide
permalink: /developer-guide/seeds
---

# Seeds

Seed steps populate the database with initial data during `pnpm seed`. Each step is an async function registered in a profile, executed sequentially with access to a database transaction and the profile's file path.

## Seed handler interface

```ts
type SeedHandler = (
  trx: Knex.Transaction,
  profilePath: string,
) => Promise<void>;
```

## Creating a seed step

Create a file that exports a `SeedHandler` function:

```ts
// src/seeds/my-seed/my-seed.ts
import type { Knex } from 'knex';
import { mapAsync } from '../../helpers/utils/utils';
import { stripI18n } from '../../helpers/i18n/i18n';
import { fileExists } from '../../helpers/fs/fs';
import models from '../../models';

export const seedMyData = async (
  trx: Knex.Transaction,
  profilePath: string,
): Promise<void> => {
  const MyModel = models.get('MyModel');

  if (await fileExists(`${profilePath}/my_data`)) {
    const profile = stripI18n((await import(`${profilePath}/my_data`)).default);

    if (profile.purge) {
      await MyModel.delete({}, trx);
    }

    await mapAsync(profile.items, async (item: any) => {
      await MyModel.create(item, {}, trx);
    });

    console.log('My data imported');
  }
};
```

The `profilePath` parameter points to the profile's directory on disk, so you can read JSON files from it (e.g. `${profilePath}/my_data` resolves to `src/profiles/default/my_data`). The `stripI18n` helper processes `:i18n` suffixed keys for translation support.

## Registration

In a profile's `init()` function, register the seed step:

```ts
import seeds from '../../seeds';
import { seedMyData } from '../../seeds/my-seed/my-seed';

// In init():
seeds.register(seedMyData);
```

Seed steps run sequentially in the order they were registered. Each receives the same transaction and profile path. If any step throws, the entire transaction is rolled back.
