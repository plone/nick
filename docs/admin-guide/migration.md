---
title: Migration
nav_order: 4
permalink: /admin-guide/migration
parent: Admin guide
---

# Migration

`Nick` provides a migration script which can be used to export data (user, groups, roles, permissions, types, documents etc) from an existing running `Plone` or `Nick` website.

## Run migration

The migration can be run with the following command:

```shell
$ pnpm export <url> <login> <password> <profilename>
```

The `url` is the url of the running backend system, for example: `http://localhost:8080`

`login` and `password` are used to authenticate with the backend. Make sure to use a user with administator permissions.

`profilename` is the name of the profile that will be generated. The profile will be placed in `src/profiles/<profilename>`.

## Profile

All migrated data is placed in the above profile folder. This profile contains all data including users, groups, roles, permissions, types, documents and much more. This profile can be used (or combined with other profiles) to setup a new website.
