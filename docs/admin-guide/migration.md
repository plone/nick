---
title: Migration
nav_order: 4
permalink: /admin-guide/migration
parent: Admin guide
---

# Migration

`Nick` provides a migration script which can be used to export data (users, groups, roles, types, workflows, documents etc) from an existing running `Plone` or `Nick` website.

## Run migration

The migration can be run with the following command:

```shell
$ pnpm export <url> <login> <password> <profilename>
```

The `url` is the url of the running backend system, for example: `http://localhost:8080/Plone`

`login` and `password` are used to authenticate with the backend. Make sure to use a user with administator permissions.

`profilename` is the name of the profile that will be generated. The profile will be placed in `src/profiles/<profilename>`.

## Profile

All migrated data is placed in the above profile folder. This profile contains all data including users, groups, roles, types, documents and much more. This profile is meant to be applied on top of the `core` profile: it doesn't purge the users, roles, permissions and actions of `core`.

Each document is written to `documents/<path>.json`, where the path segments are separated by dots. Characters in ids other than letters, digits, `-` and `_` are escaped as `~<hex>` (for example `files.report~2epdf.json`), and the document contains its original `path`, which the import uses.

## What is migrated

| Data | Migrated | Notes |
| ---- | -------- | ----- |
| Content tree | Yes | Paths, ids (including ids with dots), types, uuids and field values. |
| Listing | Yes | `@search` and `@users` are read in batches of 100 (`batching.next`), so large sites are not loaded in one response. `@groups` is not batched by plone.restapi and read at once. Comments, which are cataloged, are skipped. The export stops with an error when a request fails. |
| Roles | Yes | Roles missing in Nick are added (without permissions). `Manager` and `Site Administrator` map to `Administrator`, `Member` maps to `Authenticated`. |
| Groups | Yes | Id, title, description, email and global roles. The virtual `AuthenticatedUsers` group is skipped. |
| Permissions | No | Zope permissions don't apply to Nick. Nick's own permissions are kept. |
| Actions | No | Plone actions are user interface settings with TALES conditions. Nick's own actions are kept. |
| Users | Partly | Id, full name, email, global roles, groups and other member properties (`description`, `location`, `home_page`). Portraits are not migrated. Password hashes are not available over the REST api, so every user gets its own random password and has to reset it. The user running the export keeps the password used for the export and is added as `Administrator` when it is not a site user (for example the Zope root `admin`). Users referenced by content (owners, actors) which no longer exist are added without roles, so history stays attributed. |
| Types | Yes | Schema, title, description, allowed content types and behaviors (from `@controlpanels/dexterity-types`). Plone behaviors with a Nick equivalent are mapped (for example `plone.dublincore` to `dublin_core`, `volto.blocks` to `blocks`), the fields of other behaviors stay in the schema. Types with folderish content get `folderish`, the type of the site root gets `navigation_root`. Types which are used but not listed in `@types` (like `Plone Site`) are exported too. |
| Workflows | Partly | Workflow definitions and the workflow of each type are not in the REST api. They are read from the GenericSetup export of `portal_workflow` (`portal_setup/manage_exportSelectedSteps`, needs `Manager`), converted by Nick's DCWorkflow loader (the same as for `workflows/<id>/definition.xml` in a profile, see [Workflows](/developer-guide/workflows#dcworkflow-definitions)) and replace existing workflows with the same id (`replace` in `workflows.json`). States, titles, descriptions, exit transitions, acquired permission maps and the `View`, `Modify portal content`, `Add portal content`, `Review portal content`, `Request review`, `Reply to item`, `Review comments` and `Delete objects` permissions are converted, roles are mapped like global roles and `Anonymous` also grants `Authenticated`. Guards keep their permissions (any of), roles, groups and expressions; expressions outside the [supported subset](/developer-guide/workflows#expressions) are kept but marked `unsupported` and deny until an add-on registers the methods they call. Transitions without an action are hidden, automatic transitions stay automatic, `manager_bypass` is kept. Workflow variables and their assignments and worklists are converted, and the variables of history entries are kept. The export prints what it could not convert (`workflow ...` lines). Not converted: other permissions, scripts and group maps. Types get their whole chain (`workflows`); plone.restapi only exposes the state and history of the first workflow, so documents start in the initial state of further workflows. When the export is not available, the workflows of the core profile are used. |
| Workflow states | Yes | The `review_state` of every document. Documents of types without workflow (by default `File`, `Image` and `Plone Site`) acquire their permissions from the parent in Plone; they get the default workflow and the state of their parent (the root gets the state granting `View` to `Anonymous`). Later changes of the parent state do not cascade to them. |
| Workflow history | Yes | Every transition with action, actor, comments, state, state title, time and transition title (from the `history` of `@workflow`, oldest first). The creation entry has no action and the title `Create`. |
| Versions | Yes | Every version of the `@history` endpoint with its content (`@history/<version>`), id, actor, time and change note. Documents without versions get one version of the current content on import. |
| Local roles | Yes | Roles given to users and groups on the document itself (`@sharing`) and the inherit flag (blocked inheritance). Acquired and global roles are not stored per document. Local roles of the virtual `AuthenticatedUsers` group, and local roles which are not on the sharing page, are not migrated. The `Owner` role follows the owner of the document. |
| Files and images | Yes | The original data of every file and image field (`@@download/<field>`) is written to `documents/blobs/<uuid>/<field>/<filename>` and imported byte for byte with its filename and content type (`{"path": ..., "filename": ..., "content-type": ...}`). Image scales are generated by Nick. Versions refer to the same file when it is unchanged; older versions of changed files can not be downloaded over the REST api and are not migrated. |
| Relations | Yes | Relation lists (like `relatedItems`) are stored as uuids, relation choices (like `preview_image_link`) as a list with one summary. Plone uids are converted to uuids. Urls of the site in field values and blocks (links, teasers, images) become paths relative to the site root. Relations to content outside the site are not migrated. |
| Translations | Yes | Language and translation links (`?expand=translations`). Plone does not expose its translation group, so a uuid derived from the paths of all translations of a document is used as `translation_group`. |
| Redirects | Yes | Manual and automatic aliases (`@aliases` of the site root) with their date, for documents which are exported. |
| Comments | Yes | Comments and replies (`@comments`) with id, author, dates and text, and the `allow_discussion` flag. The author full name and the review state of comments (`comment_review_workflow`) are not migrated. |
| Folder order | Yes | The position of every document in its folder (from `@search` sorted on `getObjPositionInParent`). |
| Site settings | Partly | Site title, `robots.txt`, default and available languages and the multilingual flag (`@site`) go to the `site` and `language` controlpanels. The site logo and other registry settings and controlpanels are not migrated. |
| Queries | Yes | Querystring operations of collections and listing blocks get Nick names (`plone.app.querystring.operation.selection.any` becomes `selection.any`). |

## Passwords

Password hashes are not available over the REST api. The generated `users.json` contains a random password per user in clear text, because the seed hashes them on import. Treat the profile as a secret and remove `users.json` (or the passwords) after the import. Users set a new password with the password reset of `Nick`.

## Not migrated

These parts of a Plone site can not be read over the REST api or have no equivalent in `Nick`:

- Password hashes. plone.restapi never returns them. A lossless password migration needs a Plone side export of the hashes (for example `collective.exportimport`) and support for the Zope `AuthEncoding` schemes (SSHA, BCRYPT) in the `Nick` login, rehashing on the first login.
- Older versions of files and images. `@history/<version>` refers to the current file, there is no endpoint for the file of an older version.
- Workflow scripts, group maps of states, guard expressions outside the supported subset (they are migrated but deny until the methods they call are registered), permissions which are not in the mapping above, acquisition of permissions from the parent (acquired permissions come from the global role permissions in Nick; types without workflow get the state of their parent once, at export) and the states and history of further workflows of a chain (not in the REST api).
- Local roles of the virtual `AuthenticatedUsers` group, local roles from adapters (`borg.localrole`) and groups in groups.
- Portraits, the site logo, other registry settings and controlpanels, content rules, portlets, working copies, locks, placeful workflow policies and permission settings outside workflows.
- The review state and author full name of comments.

## Verify a migration

The plonex `restapi-suite` has an opt-in round trip test (`tests/test_migration_roundtrip.py`, marker `migration`). It seeds a Plone 6.2 site, and after `pnpm export` and an import into an empty `Nick` it compares the content tree, states, local roles, workflow history, versions, files (byte for byte), relations, translations, redirects, comments and the search results for anonymous and several users.
