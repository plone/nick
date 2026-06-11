---
title: Profiles
parent: Developer guide
permalink: /developer-guide/profiles
---

# Profiles

Nick uses a modular architecture where functionality is organized into profiles. Each project can have multiple active profiles that add or change functionality. Profiles are registered in `config.ts` and applied in order.

```
📦 src/profiles/my_profile/
├── metadata.json          # Profile metadata (id, title, version)
├── index.ts               # Runtime registration (models, seeds, routes, etc.)
├── catalog.json           # Catalog indexes and metadata
├── roles.json             # Role definitions
├── permissions.json       # Permission definitions
├── actions.json           # Action definitions
├── types/                 # Content type definitions
├── behaviors/             # Behavior definitions
├── controlpanels/         # Control panel configurations
├── workflows.json         # Workflow definitions
├── users.json             # User definitions
├── groups.json            # Group definitions
├── vocabularies/          # Vocabulary definitions
├── redirects.json         # Redirect definitions
├── seeds.json             # Seed data
└── upgrades/              # Incremental upgrade steps
    ├── 1001/
    ├── 1002/
    └── ...
```

## Registration

Profiles are listed in the `profiles` array in `config.ts`. The name before the colon resolves to the Node package name; the part after the colon is the folder name of the profile.

```ts
export const config = {
  profiles: [
    '@plone/nick:core',
    'my_nick_project:default',
  ],
};
```

## Metadata

Each profile has a `metadata.json` file that identifies it and tracks its version:

```json
{
  "id": "@plone/nick:core",
  "title": "Nick Core",
  "description": "Core functionality of Nick",
  "version": 1006
}
```

| Field         | Type     | Description                               |
| ------------- | -------- | ----------------------------------------- |
| `id`          | `string` | Unique identifier for the profile.        |
| `title`       | `string` | Human-readable name of the profile.       |
| `description` | `string` | Brief description of the profile's role.  |
| `version`     | `number` | Current version number for upgrade tracking. |

## Runtime registration (`index.ts`)

When Nick starts, each profile's `index.ts` module is loaded and its `init()` function is called. This is where the profile registers its models, seeds, blocks, events, vocabularies, middleware, routes, behaviors, content rules, and scheduled jobs. The `initProfiles` helper (`src/helpers/profiles/profiles.ts`) iterates through profiles in order and calls `init()` on each.

## Configuration files

Profiles contain JSON files that define database records. When `pnpm seed` runs these files are read by seed handlers and applied to the database. Each file corresponds to a specific domain:

| File                          | Seed handler                    | Description                            |
| ----------------------------- | ------------------------------- | -------------------------------------- |
| `metadata.json`               | `seedProfile`                   | Profile record (version tracking).     |
| `permissions.json`            | `seedPermission`                | Permission definitions.                |
| `roles.json`                  | `seedRole`                      | Roles with assigned permissions.       |
| `actions.json`                | `seedAction`                    | Action and button definitions.         |
| `catalog.json`                | `seedCatalog`                   | Catalog indexes and metadata columns.  |
| `types/`                      | `seedType`                      | Content type definitions.              |
| `behaviors/`                  | `seedBehavior`                  | Behavior definitions.                  |
| `controlpanels/`              | `seedControlpanel`              | Control panel configurations.          |
| `workflows.json`              | `seedWorkflow`                  | Workflow definitions.                  |
| `users.json`                  | `seedUser`                      | User definitions.                      |
| `groups.json`                 | `seedGroup`                     | Group definitions.                     |
| `vocabularies/`               | `seedVocabulary`                | Vocabulary definitions.                |
| `redirects.json`              | `seedRedirect`                  | Redirect definitions.                  |
| `documents/`                  | `seedDocument`                  | Document content with version blocks.  |
| `contentrules.json`           | `seedContentRule`               | Content rule definitions.              |
| `scheduledjobs.json`          | `seedScheduledJob`              | Scheduled job definitions.             |

Each seed handler checks whether its corresponding file or directory exists at the given profile path. If it does, the data is imported; otherwise it is silently skipped. This means the same seed logic is reused for both initial profile installation and incremental upgrades.

## Seeding

The `pnpm seed` command (`scripts/seed.ts`) processes every registered profile. For each profile it:

1. Reads the profile's `metadata.json`.
2. Queries the database for the currently installed version.
3. If the profile is not yet installed (or the version in metadata is newer), it calls `seeds.run(trx, profilePath)`, which passes the profile path to every registered seed handler.

### Status

The `pnpm seed:status` command displays a table of all registered profiles, their currently installed version, and the latest version available in `metadata.json`:

```
Profile                                            Current   Latest
@plone/nick:core                                   1004      1006
my_nick_project:default                            1000      1000
```

This is useful for checking which profiles need upgrades before running `pnpm seed:upgrade`.

## Upgrades

As a profile evolves, you add upgrade steps to migrate existing installations. Upgrades live in numbered subdirectories under `upgrades/`:

```
📦 upgrades/
├── 1001/
│   ├── metadata.json
│   └── controlpanels/security.json
├── 1002/
│   ├── metadata.json
│   ├── permissions.json
│   └── roles.json
├── 1006/
│   ├── metadata.json
│   └── catalog.json
```

### Upgrade metadata

Each upgrade directory contains a `metadata.json` describing the change:

```json
{
  "id": "@plone/nick:core",
  "title": "Nick Core",
  "description": "Core functionality of Nick",
  "version": 1006,
  "upgrade": "Add position in parent catalog index."
}
```

The `upgrade` field is a human-readable description of what the step does.

### Upgrade files

Alongside `metadata.json`, an upgrade directory contains the same JSON configuration files used during initial seeding. Only the files relevant to the upgrade need to be present. For example, an upgrade that adds new permissions and roles:

**`upgrades/1002/permissions.json`:**
```json
{
  "purge": false,
  "permissions": [
    {
      "id": "View Comments",
      "title:i18n": "View Comments"
    },
    {
      "id": "Add Comment",
      "title:i18n": "Add Comment"
    }
  ]
}
```

**`upgrades/1002/roles.json`:**
```json
{
  "purge": false,
  "roles": [
    {
      "id": "Anonymous",
      "title:i18n": "Anonymous",
      "permissions": ["View Comments"]
    },
    {
      "id": "Authenticated",
      "title:i18n": "Authenticated",
      "permissions": ["View Comments", "Add Comment"]
    }
  ]
}
```

### Running upgrades

Use the `pnpm seed:upgrade` command to apply pending upgrades. The upgrade logic in `scripts/seed.ts` works as follows:

1. **Compare versions**: For each profile, the current installed version (from the database) is compared against the latest version in `metadata.json`.
2. **Calculate gap**: If the installed version is behind, the difference determines how many upgrade steps to apply.
3. **Sequential execution**: Each missing step is applied in order by calling `seeds.run(trx, ".../upgrades/<version>")` for each version number. For example, if the installed version is `1003` and the latest is `1006`, upgrades `1004`, `1005`, and `1006` are applied sequentially.
4. **Idempotent seed handlers**: Each seed handler checks for the presence of its corresponding file inside the upgrade directory. If the file exists, the changes are applied; if not, the handler skips. This means an upgrade step only needs to include the files that actually change.

If any step fails, the entire transaction is rolled back, ensuring consistency.

### Creating a new upgrade

To add a new upgrade step:

1. Create a new directory under `upgrades/` named after the next version number (e.g., `1007`).
2. Add a `metadata.json` with the profile id, version, and a description of the change.
3. Add only the JSON configuration files that need to change (e.g., `catalog.json`, `permissions.json`, `roles.json`, `controlpanels/`, etc.).
4. Update the profile's root `metadata.json` to reflect the new version number.

The seed handlers will pick up the new files automatically — no manual registration is required.
