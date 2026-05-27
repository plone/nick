---
title: Models
parent: Developer guide
permalink: /developer-guide/models
---

# Models

Models represent database tables and provide CRUD operations. They extend Objection.js `Model` and are registered in a profile for lazy access throughout the application.

## Creating a model

Create a file that defines a class extending the base `Model`:

```ts
// src/models/my-model/my-model.ts
import { Model } from '../_model/_model';

export class MyModel extends Model {
  static tableName: string = 'my_model';

  declare id: string;
  declare title: string;
  declare json: any;
}
```

### Custom id column

If the primary key is not the default `id`, override `idColumn`:

```ts
static idColumn: string = 'uuid';
```

For composite primary keys, return an array:

```ts
static get idColumn(): string[] {
  return ['document', 'path'];
}
```

### Relations

Define relations using Objection's `relationMappings`. Use `models.get()` inside the getter to avoid circular imports:

```ts
static get relationMappings(): any {
  const Related = models.get('RelatedModel');
  return {
    _related: {
      relation: Model.BelongsToOneRelation,
      modelClass: Related,
      join: { from: 'my_model.related_id', to: 'related.id' },
    },
  };
}
```

Supported relation types: `BelongsToOneRelation`, `HasManyRelation`, `ManyToManyRelation`.

### Custom collection

If the model needs a custom collection class for serialization, set the `collection` static:

```ts
import { MyCollection } from '../../collections/my-collection/my-collection';

export class MyModel extends Model {
  static collection = MyCollection as unknown as (typeof Model)['collection'];
}
```

## Database migration

Create a migration file in `src/migrations/` to create the table:

```ts
// src/migrations/202605270000_my_model.ts
import { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('my_model', (table) => {
    table.string('id').primary();
    table.string('title');
    table.jsonb('json');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable('my_model');
};
```

Run the migration with `pnpm knex migrate:latest`.

## Registration

In a profile's `init()` function, register the model with a factory function:

```ts
import models from '../../models';
import { MyModel } from '../../models/my-model/my-model';

// In init():
models.register('MyModel', () => MyModel);
```

The factory pattern is used to avoid circular dependency issues with relation mappings. After registration, any part of the application can access the model:

```ts
const MyModel = models.get('MyModel');
const items = await MyModel.fetchAll({}, { order: 'title' }, trx);
const item = await MyModel.create(data, {}, trx);
```
