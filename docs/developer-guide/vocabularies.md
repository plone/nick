---
title: Vocabularies
parent: Developer guide
permalink: /developer-guide/vocabularies
---

# Vocabularies

Vocabularies provide lists of `{token, title}` pairs served via `GET /@vocabularies/:name`. They are used for field choices (e.g. content types, roles, languages, workflow states).

## Types

```ts
interface VocabularyTerm {
  title: string;
  token: string;
}

type Vocabulary = VocabularyTerm[];

type VocabularyHandler = (
  req: Request,
  trx: Knex.Transaction,
) => Promise<Vocabulary>;
```

## Two approaches

### Code-based vocabulary

Create an async handler function that returns an array of `{title, token}` terms, then register it with the in-memory registry.

**Model-driven** — fetch records from a model and delegate to `getVocabulary()`:

```ts
// src/vocabularies/my-vocab/my-vocab.ts
import models from '../../models';

export async function myVocab(
  req: Request,
  trx: Knex.Transaction,
): Promise<Vocabulary> {
  const MyModel = models.get('MyModel');
  const items = await MyModel.fetchAll({}, { order: 'title' }, trx);
  return items.getVocabulary(req);
}
```

**Static/config-driven** — return terms from config or constants:

```ts
import config from '../../helpers/config/config';
import { arrayToVocabulary } from '../../helpers/utils/utils';

export async function myVocab(
  _req: Request,
  _trx: Knex.Transaction,
): Promise<VocabularyTerm[]> {
  return arrayToVocabulary(config.settings.myList);
}
```

**Computed** — transform DB data before returning:

```ts
import { uniq } from 'es-toolkit/array';
import { arrayToVocabulary } from '../../helpers/utils/utils';
import models from '../../models';

export async function myVocab(
  req: Request,
  trx: Knex.Transaction,
): Promise<VocabularyTerm[]> {
  const Catalog = models.get('Catalog');
  const items = await Catalog.fetchAll({ field: ['is not', null] }, {}, trx);
  return arrayToVocabulary(uniq(items.map((item) => item.field)));
}
```

### Profile-based vocabulary (JSON)

For static vocabulary data, place a JSON file in the profile's `vocabularies/` directory. It is automatically loaded into the database when the profile is installed:

```json
{
  "id": "my_vocab",
  "title:i18n": "My Vocabulary",
  "items": [
    { "title:i18n": "Option One", "token": "option_one" },
    { "title:i18n": "Option Two", "token": "option_two" }
  ]
}
```

The `:i18n` suffix enables translation of the title at runtime.

## Registration

In a profile's `init()` function, register the vocabulary handler:

```ts
import vocabularies from '../../vocabularies';
import { myVocab } from '../../vocabularies/my-vocab/my-vocab';

// In init():
vocabularies.register('myVocab', myVocab);
```

The vocabulary is then available at `GET /@vocabularies/myVocab`.

## Helper functions

```ts
// Each array item becomes { title: item, token: item }
arrayToVocabulary(['a', 'b']);
// → [{ title: 'a', token: 'a' }, { title: 'b', token: 'b' }]

// Each object entry becomes { title: value, token: key }
objectToVocabulary({ key1: 'Value 1', key2: 'Value 2' });
// → [{ title: 'Value 1', token: 'key1' }, { title: 'Value 2', token: 'key2' }]
```
