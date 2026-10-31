---
title: Add-ons
parent: Developer guide
permalink: /developer-guide/addons
---

# Add-ons

An add-on is an npm package that depends on `@plone/nick` and contains one or more [profiles](/developer-guide/profiles). It can add content types, behaviors, REST services, vocabularies, blocks, event subscribers, control panels, scheduled jobs and its own tables with its own migrations, without changing Nick itself. Projects created with the [generator](/admin-guide/installation) are structured the same way: the project is a package with a profile.

`packages/nick-example-addon` in the Nick repository is a complete example. It adds a `Review` content type, an `example_rating` behavior, the `@notes` and `@rating` services, a nightly scheduled job, a `note` table in its own `example` Postgres schema, and two migrations (a schema migration and a batched data migration). Its tests install it and use every extension point.

## Package

```json
{
  "name": "@acme/nick-addon",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./package.json": "./package.json"
  },
  "nick": {
    "profiles": "src/profiles",
    "migrations": "src/migrations",
    "schema": "acme"
  },
  "peerDependencies": {
    "@plone/nick": "^3.0.0"
  }
}
```

| `nick` field      | Description                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`        | Directory of the profiles. Default: `profiles` next to the entry point of the package (`src/profiles` for `./src/index.ts`).    |
| `migrations`      | Directory of the knex migrations of the package. They form the package's own migration chain.                                   |
| `schema`          | Postgres schema of the package's tables. Nick creates it (`create schema if not exists`) before it runs the package migrations. |
| `migrationsTable` | Name of the migration ledger. Default: `knex_migrations_<package>`, like `knex_migrations_acme_nick_addon`.                     |

Export `./package.json`, so Nick can find the package from the project. Add-ons are TypeScript sources like Nick; the `tsx` loader runs them.

## Profiles and dependencies

A profile's `metadata.json` declares the profiles it needs:

```json
{
  "id": "@acme/nick-addon:default",
  "title": "Acme add-on",
  "version": 1000,
  "dependencies": ["@plone/nick:core"]
}
```

Profiles are listed in `profiles` in `config.ts` or in the `PROFILES` environment variable (comma separated, it replaces the list in `config.ts`):

```bash
PROFILES=@plone/nick:core,@acme/nick-addon:default pnpm nick
```

Nick loads, installs and upgrades the profiles in dependency order: the dependencies of a profile come before it, and profiles which are not listed are added. Otherwise the order of the list is kept. A dependency cycle or a dependency that cannot be resolved is an error. Dependencies are profile names as used in `profiles` (`<package>:<profile directory>`).

A package is resolved from the project: the project itself (the `package.json` in the working directory), a dependency of the project, or a package Nick can resolve.

## Public API

Import from `@plone/nick` only:

```ts
import { behaviors, models, routes, scheduledJobs } from '@plone/nick';
import type { Request, Route } from '@plone/nick';
```

Deep imports like `@plone/nick/src/routes` still work, but they are **deprecated**: they are not part of the API and can change in any release.

| Group                    | Exports                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registries               | `behaviors`, `blobs`, `blocks`, `contentRules`, `events`, `middleware`, `models`, `routes`, `scheduledJobs` (actions), `seeds`, `vocabularies`                                                                                   |
| Models                   | `Model`, `Collection`                                                                                                                                                                                                             |
| Configuration and DB     | `config`, `knex`, `log`                                                                                                                                                                                                           |
| Requests                 | `RequestException`, `getUrl`, `getUrlByPath`, `getRootUrl`, `getPath`, `hasPermission`, `getControlpanelSettings`                                                                                                                 |
| Jobs and data migrations | `jobs`, `migrateInBatches`, `registerDataMigration`, `queueDataMigration`, `dataMigrationProgress`                                                                                                                                |
| Profiles and migrations  | `configuredProfiles`, `resolveProfiles`, `resolveProfile`, `resolvePackage`, `getProfiles`, `getPackages`, `readMetadata`, `initProfile`, `initProfiles`, `installProfiles`, `upgradeProfiles`, `migrateDatabase`, `migrateChain`, `migrationChains`, `migrationStatus`, `migrationTable`, `MigrationSource` |
| Utilities                | `mapAsync`, `mapSync`, `uniqueId`, `stripI18n`, `Client`, `getApp` (the Express app, for tests)                                                                                                                                   |
| Types                    | `Knex`, `Request`, `Route`, `View`, `Json`, `JsonObject`, `Params`, `Schema`, `Block`, `MiddlewareHandler`, `SeedHandler`, `Vocabulary`, `VocabularyTerm`, `VocabularyHandler`, `ScheduledJobAction`, `ScheduledJobContext`, `ContentRuleAction`, `ContentRuleCondition`, `ProfileMetadata`, `NickPackageConfig`, `ConfigSettings`, `DataMigration`, `BatchHandler`, `MigrationChain`, `PackageInfo`, `ProfileInfo` |
| Workflows                | `registerExpressionMethod` (content methods for guard expressions, see [Workflows](/developer-guide/workflows#methods-of-add-ons)), type `ExpressionMethod`                                                                                                                                                                                                                                                                         |

Control panels are profile data: add them as `controlpanels/<id>.json` in a profile, and read their settings with `getControlpanelSettings(id, trx)`.

## Registering the extension points

The profile's `index.ts` registers the code, `init()` is called when Nick starts:

```ts
import {
  behaviors,
  models,
  routes,
  scheduledJobs,
  registerDataMigration,
} from '@plone/nick';

export function init(): void {
  models.register('AcmeNote', () => Note); // own table
  behaviors.register('acme_rating', rating); // code half of a behavior
  routes.register(notesRoutes); // REST services
  scheduledJobs.registerAction('acme_purge', purge); // action of a scheduled job
  registerDataMigration(noteWords); // may run on the job queue
}
```

The data halves are files in the profile: `types/<type>.json`, `behaviors/<behavior>.json`, `controlpanels/`, `catalog.json` and so on (see [Profiles](/developer-guide/profiles)).

Routes registered later take precedence, so register add-on routes after core's (the dependency order does that).

## Scheduled jobs

An add-on adds [scheduled jobs](/developer-guide/scheduled-jobs) like any other profile, in a `scheduled_jobs.json` file of its profile, and registers the actions they run with `scheduledJobs.registerAction()`. The scheduled jobs are stored when the profile is installed, so a site administrator can change their schedule or disable them through `@scheduled-jobs`. The workers run each of them once per time slot across all workers, as a job with retries. Don't use `purge` in an add-on: it removes the scheduled jobs of the site and of other profiles.

```json
{
  "scheduled_jobs": [
    {
      "id": "acme-purge",
      "title": "Purge notes",
      "action": "acme_purge",
      "schedule": "0 3 * * *"
    }
  ]
}
```

## Tables and migrations

Each package has its own migration chain: the knex migrations in its `nick.migrations` directory, recorded in its own ledger table. `nick --modules=migrate` runs core's chain first, then the chains of the packages of the configured profiles in dependency order, then installs and upgrades the profiles. Every migration runs in its own transaction, so when one fails, the ones before it stay applied, `migrate` exits with code 1 and the next run continues with the one that failed.

Put the tables of an add-on in its own Postgres schema (`nick.schema`), so they cannot collide with core's tables (`job`, `index`, `file`, ...):

```ts
// src/migrations/202610200900_note.ts
import type { Knex } from '@plone/nick';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.withSchema('acme').createTable('note', (table) => {
    table.increments('id').primary();
    table.uuid('document').notNullable().index();
    table.text('text').notNullable();
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.withSchema('acme').dropTable('note');
};
```

Models use the schema-qualified table name: `static tableName = 'acme.note'`.

Migrations can import from `@plone/nick`; Nick loads them itself. `pnpm migrate` (the knex command line) only runs core's chain; use `pnpm nick --modules=migrate` for all chains.

### Batched data migrations

Large data changes run in batches with `migrateInBatches`. Every batch runs in its own transaction together with its cursor in the `migration_progress` table, so an interrupted migration resumes after its last committed batch, and a finished one is not run again. Turn off knex's transaction for the migration, otherwise the whole migration is one transaction:

```ts
import type { DataMigration, Knex } from '@plone/nick';
import { migrateInBatches } from '@plone/nick';

export const config = { transaction: false };

export const noteWords: DataMigration<number> = {
  name: '@acme/nick-addon:note_words',
  batch: async (trx, cursor) => {
    const notes = await trx('acme.note')
      .where('id', '>', cursor || 0)
      .orderBy('id')
      .limit(1000);
    for (const note of notes) {
      await trx('acme.note')
        .where({ id: note.id })
        .update({ words: note.text.split(/\s+/).length });
    }
    // The cursor of the next batch, or undefined when done
    return notes.length === 1000 ? notes[notes.length - 1].id : undefined;
  },
};

export const up = async (knex: Knex): Promise<void> => {
  // Steps before the batches must be safe to run again
  if (!(await knex.schema.withSchema('acme').hasColumn('note', 'words'))) {
    await knex.schema.withSchema('acme').alterTable('note', (table) => {
      table.integer('words');
    });
  }
  await migrateInBatches(noteWords, knex);
};
```

To run a data migration in the background instead, register it with `registerDataMigration(noteWords)` in `init()` and queue it, for example from an upgrade step, with `queueDataMigration(name, trx)`. A worker runs the batches; when the worker stops or a batch fails, the job is retried and resumes after the last committed batch. Queueing it again while it is queued or running does nothing. Code that depends on the migrated data can check `dataMigrationProgress(name)`.

### Drift check

`pnpm migrate:check` migrates a scratch database (`<database>_check`) from scratch, installs the profiles and compares the schema with the committed snapshot `src/migrations/schema.snapshot.txt`. It fails when a migration or upgrade fails, when a second `migrate` changes the schema, when a registered model has no table, or when the schema differs from the snapshot. After changing migrations or catalog indexes, run `pnpm migrate:check --update` and commit the snapshot; the diff shows the schema change for review.

The snapshot includes the columns that profiles create at runtime (catalog indexes and metadata), marked `# profile`, so a catalog change is visible as a schema change too. For an add-on, check only its own schema:

```bash
PROFILES=@plone/nick:core,@acme/nick-addon:default \
  pnpm migrate:check --schema acme --snapshot src/migrations/schema.snapshot.txt
```

`nick --modules=migrate --check-schema[=<snapshot>]` compares a live database with the snapshot after migrating and exits with code 1 when it differs.

## Testing an add-on

Tests run against a migrated and seeded database, each test in a transaction that is rolled back (see `vitest.setup.ts`). Install the add-on in that transaction and register its code before the app builds its routes:

```ts
import {
  getApp,
  initProfile,
  initProfiles,
  installProfiles,
  migrateDatabase,
  resolvePackage,
  resolveProfile,
} from '@plone/nick';

let app;
let profile;

beforeAll(async () => {
  profile = await resolveProfile('@acme/nick-addon:default');
  await initProfiles(); // core first
  await initProfile(profile.path);
  app = await getApp();
});

beforeEach(async () => {
  await migrateDatabase(global.txn, [resolvePackage('@acme/nick-addon')]);
  await installProfiles(global.txn, [profile.path]);
});
```

## Docker

Projects build their own image with `@plone/nick` and their add-ons as dependencies and `node --import tsx node_modules/@plone/nick/scripts/nick.ts` as entrypoint. Nick's own image can include add-ons from its repository with `--build-arg ADDONS="packages/nick-example-addon"`; select the profiles with `PROFILES`.
