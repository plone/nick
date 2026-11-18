# Change Log

## 0.1.2 (2026-11-18)

### Bugfix

- Depend on `@plone/nick` `^3.1.0` in generated projects @robgietema

## 0.1.1 (2026-10-31)

### Bugfix

- Add `jiti` and `@types/jsonwebtoken` to the devDependencies of generated projects, so `pnpm lint` and `pnpm typecheck` work @robgietema

## 0.1.0 (2026-10-31)

### Breaking

- Generated projects depend on the `@plone/nick` npm package instead of a source checkout in `src/develop/nick` (mrs-developer), import from `@plone/nick`, run with the `nick` command and keep their migrations in their own chain (`nick.migrations` in package.json) instead of a knexfile.ts. See the Nick changelog for moving an existing project @martior

## 0.0.7 (2024-12-18)

### Bugfix

- Fix profiles templates @robgietema

## 0.0.6 (2024-12-18)

### Bugfix

- Fix profiles templates @robgietema

## 0.0.5 (2024-12-18)

### Bugfix

- Fix profiles templates @robgietema

## 0.0.4 (2024-12-18)

### Feature

- Add Node 23 support @robgietema

## 0.0.3 (2024-12-13)

### Bugfix

- Change seed in config @robgietema

## 0.0.2 (2024-12-13)

### Bugfix

- Change templates to match new config @robgietema

## 0.0.1 (2022-10-11)

### Feature

- Initial release @robgietema
