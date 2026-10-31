# Change Log

## 3.0.1 (unreleased)

## 3.0.0 (2026-10-31)

### Breaking

- Unset dates in search results and other catalog results are sent like Plone: `EffectiveDate` and `ExpirationDate` are `"None"` and `CreationDate` and `ModificationDate` `"Unknown"` instead of `null`, so frontends written for Plone (Volto, Aurora) no longer show every item as expired @mpalomaki
- Ids generated from titles follow the url normalizer of Plone: every character but letters, digits, underscore and dash is a dash, dots too (a comma, `&`, `%`, `#`, `;`, `=` or `.` no longer ends up in the id), and a title without letters or digits gives the type as id. Existing ids don't change @mpalomaki
- Require the Manage Site permission and the site root for the @email-send and @users/<id>/@email-notification endpoints @martior
- Require the Manage Site permission for the @content-rules endpoints @martior
- Require the Modify permission for the users and groups vocabularies, like Plone @martior
- Require the Modify permission to list the aliases of an item, and Manage Site to list all aliases of the site @martior
- Only use the default secret 'secret' when NODE_ENV is development or test, use a random secret otherwise when none is configured @martior
- Only list and grant the roles the user may delegate in @sharing, with new Delegate <role> permissions (upgrade 1007) @martior
- Ids starting with `@` are refused with 400 on create and rename, so content can't hide services like `@search` below a folder @martior
- Reverting with `@history` also requires the Modify permission in the current state, so a revert can't change content the workflow doesn't let the user edit (for example an Editor on a pending item); `may_revert` follows @martior
- A workflow transition of content locked by another user is refused with `403 Resource is locked.`, like edits and deletes @martior
- A lock token only lets the creator of the lock edit, revert, move or delete the locked content; another user who learned the token is refused. The token is no longer shown in `@lock` and in the `lock` of the content to users without the Modify permission @martior
- Listing the history and getting previous versions require the new View History permission instead of View, given to Owner, Contributor, Editor, Reviewer and Administrator; anonymous users and members can no longer read old versions of published content. Run `pnpm seed:upgrade` @martior
- Workflows use the `acquire` permission model by default: for the permissions a workflow manages (default: those used in its states), the roles a state lists replace the global role permissions instead of being added to them, like in Plone. Run `pnpm permissions:dry-run` before upgrading to list the content whose permissions change, then `pnpm seed:upgrade` (upgrade 1018); set `"permission_model": "additive"` on a workflow to keep the old behaviour. The core workflow now lists Reader in the private and pending states @martior
- Deleting content requires the new Delete permission instead of Modify. The core profile gives it to Owner, Editor and Administrator; run `pnpm seed:upgrade`, and give Delete to custom roles that should keep deleting @martior
- Return the @users listing as an object with items and items_total like plone.restapi, and support the search, groups-filter:list and limit parameters @martior
- Require the Modify permission for the users and subjects vocabularies (and their plone.app.vocabularies names), like Plone @martior
- Require the Manage Users permission for @roles, like Plone @martior
- Error responses have the plone.restapi shape `{ "type": ..., "message": ... }`: 404 responses no longer use `{ "error": ... }`, and an invalid JSON body gives a JSON 400 instead of an HTML page. Redirects have an absolute `Location` header @martior
- The items of a folder are batched like in plone.restapi (`b_start`, `b_size`, default 25 items) with `items_total` and `batching`; clients that expect all children in `items` have to page or pass a larger `b_size` @martior
- A @sharing entry is the complete set of the principal's local roles, like in Plone: roles not named in the entry are revoked. Clients that sent only the changed roles must send all roles @martior
- The core workflow gives `Owner` `View` and `Modify` in the private state, `View` in the pending state and `Modify` in the published state, like Plone's simple publication workflow, so creators can view and edit their own private items. Run `pnpm seed:upgrade` (upgrade 1014) @martior
- A request without the needed permission answers `401 Unauthorized` with type `Unauthorized` for authenticated users too, like plone.restapi, instead of `403 Forbidden` @martior
- @contextnavigation has the shape and the tree of plone.restapi's: an envelope with `available`, `has_custom_name`, `title` and `url`, items with `href`, `type`, `normalized_id`, `is_current`, `is_in_path` and `is_folderish` instead of catalog metadata, and the `topLevel`, `currentFolderOnly`, `root_path` and `name` parameters @martior
- Importing `src/app.ts` no longer schedules or runs jobs, and jobs no longer run in a child process per job by default. Run a worker with `nick --modules=worker` (`src/server.ts` and `pnpm start` run the API and a worker); set `jobs.isolation` to `process` to keep the child processes. Run `pnpm migrate` for the job queue table @martior
- Projects created with the generator depend on the `@plone/nick` npm package instead of a source checkout of Nick in `src/develop/nick` (mrs-developer), and keep their migrations in their own chain (`nick.migrations` in package.json) instead of in knexfile.ts. Existing projects keep working unchanged. To move one: remove `src/develop`, `mrs.developer.json`, the `workspaces` entry and the `develop`/`preinstall` scripts, add `@plone/nick` as a dependency, import from `@plone/nick` instead of `@plone/nick/src/...`, set `localesDir` to `node_modules/@plone/nick/locales`, and either keep knexfile.ts (its directories stay in the core ledger `knex_migrations`) or add `"nick": { "migrations": "src/migrations" }` to package.json, move the project's rows from `knex_migrations` to `knex_migrations_<project>` (as named by `migrationTable()`, created with the columns of `knex_migrations`) and remove knexfile.ts @martior

### Feature

- Support several workflows per type (workflow chains, `workflows` in a type profile and `workflows.xml`, the new `type_workflow` table). Further workflows keep their state in the workflow status of the document, `@workflow` offers the transitions of all workflows like plone.restapi and takes a transition in the first workflow providing it, and the permissions of all states apply in turn. The export keeps the chains. Run `pnpm migrate` @martior
- Add DCWorkflow worklists to workflows and the `@worklists` endpoint: the worklists the user passes the guard of, with the matching content they can view (by state and workflow variables, batched). The loader converts worklists @martior
- Add DCWorkflow variables to workflows: `for_status` variables with default values and expressions, values set by states and expressions of transitions, stored with the history and in the new `document_workflow_status` table, `info_guard` (`review_history` hides the `@workflow` history like Plone) and `getInfoFor` in expressions. The loader converts variables and the export keeps them in the history. Run `pnpm migrate` @martior
- Load Plone DCWorkflow definitions: `workflows/<id>/definition.xml` and `workflows.xml` bindings in a profile and `pnpm workflows:import`. The export from Plone uses the same loader, so migrated sites keep their guards (permissions, roles, groups, expressions), acquired permissions, hidden and automatic transitions. Adds the `Review Comments` permission for Reviewer and Administrator; run `pnpm seed:upgrade` (upgrade 1019) @martior
- Add DCWorkflow guards to workflow transitions: one of a list of permissions, roles or groups and an expression, plus `manager_bypass`, `hidden` and automatic transitions. Expressions use a safe evaluator for the TALES subset of DCWorkflow definitions (`python:`, path, `not:`, `exists:`, `string:`); add-ons can provide content methods with `registerExpressionMethod`, and unsupported expressions are refused when a workflow is seeded @martior
- Add the `host` setting (`BIND_HOST`) to listen on one address, for example `127.0.0.1` behind a reverse proxy, instead of on every interface @mpalomaki
- Support range requests on `@@download`, so audio and video players can seek without downloading the file from the start @mpalomaki
- Sort on `sortable_title` like Plone: case and accents are ignored and numbers are compared by value, so `Item 2` comes before `Item 10`; folder sorting on `sortable_title` does the same. Run `pnpm seed:upgrade` (upgrade 1017 recomputes the sortable titles in the catalog from the title metadata, no full reindex needed) @martior
- Add the `isFolderish` catalog index of Plone, which Volto's listing block offers; `is_folderish` keeps working. Run `pnpm seed:upgrade` (upgrade 1016) @martior
- Add an `acquire` permission model to workflows (`permission_model`, `managed_permissions` and per state `acquire`), where the roles of a state replace the global role permissions like in Plone @martior
- Add support for multiple profiles @robgietema
- Add yeoman generator to create a Nick project @robgietema
- Add vocabularies based on profiles @robgietema
- Make behaviors and vocabularies extendable @robgietema
- Add Yeoman instructions @robgietema
- Add files and images loading in profiles @robgietema
- Add relation list fields @robgietema
- Add @export view to export current content object data @robgietema
- Add exclude from nav to type information @robgietema
- Move exclude from nav by type to controlpanel @robgietema
- Add additional items to navigation controlpanel @robgietema
- Add overwrite settings in controlpanels @robgietema
- Add option to overwrite title via behaviors @robgietema
- Add fetch reference helper method @robgietema
- Add expand catalog option to get content call @robgietema
- Add content events @robgietema
- Add profile metadata @robgietema
- Add @site endpoint @robgietema
- Add upgrade profile functionality @robgietema
- Add login by email @robgietema
- Add url to action @robgietema
- Add navroot endpoint @robgietema
- Add language token to content objects @robgietema
- Add support for expanders in content fetching @robgietema
- Add available languages endpoint @robgietema
- Add multilingual support @robgietema
- Add converter from plone.exportimport @robgietema
- Add Nick endpoint @robgietema
- Add support for images in controlpanels @robgietema
- Add preview link support @robgietema
- Add block types index @robgietema
- Expand image data in block data @robgietema
- Add querystring search @robgietema
- Add @inherit endpoint @robgietema
- Add client object @robgietema
- Add @catalog endpoint @robgietema
- Add multilingual settings to site endpoint @robgietema
- Add types controlpanel endpoints @robgietema
- Add layouts to contenttypes @robgietema
- Add behaviors to fieldsets and properties in schema @robgietema
- Add @export documentation and tests @robgietema
- Add SearchableText metadata to the catalog @robgietema
- Add support for disabled metadata catalog entries @robgietema
- Add support for AI models @robgietema
- Add @generate endpoint @robgietema
- Add @related endpoint @robgietema
- Add similarity property to @related endpoint @robgietema
- Fetch indexes from db instead of profiles @robgietema
- Add search based on embedding model @robgietema
- Add image recognition and indexing using a vision model @robgietema
- Add summary metadata index using an LLM to create a summary @robgietema
- Add indexing to pdf files. @robgietema
- Add embedding search to querystring search @robgietema
- Add @chat endpoint @robgietema
- Add parameters and context to generate endpoint @robgietema
- Add attachment support to generate and chat endpoints @robgietema
- Add streaming to generate endpoint @robgietema
- Add client side tools to assistant @robgietema
- Add msgctxt to po and pot files @robgietema
- Add AI controlpanel with prompts @robgietema
- Option to pass JWT secret in env @robgietema
- Disable user registration by default @robgietema
- Add security headers @robgietema
- Add rate limiting to the search and auth calls @robgietema
- Add config option for request limits @robgietema
- Added translations for 30 languages @mpalomaki @robgietema
- Added scheduled task support @robgietema
- Add events vocabulary @robgietema
- Store and revoke user tokens @robgietema
- Add api limiter to email notification endpoint @robgietema
- Add @userschema endpoints @robgietema
- Add security and usergroup controlpanel @robgietema
- Check username or email on login based on controlpanel @robgietema
- Add principals endpoint @robgietema
- Add custom userschema to config @robgietema
- Add custom userschema to endpoints @robgietema
- Add aliases endpoints @robgietema
- Add cache headers for all routes @robgietema
- Add etag support for caching @robgietema
- Add xkeys support for caching @robgietema
- Add purge support for caching @robgietema
- Add recursive applying workflow changes to endpoint @robgietema
- Add support for blob storage written to database @robgietema
- Add event content type @robgietema
- Add ics view endpoint @robgietema
- Add ics view to folders to fetch events recursively @robgietema
- Make end date in events optional @robgietema
- Replace momentjs with dayjs @robgietema
- Add basic crud operations for content rules @robgietema
- Add content rules actions and conditions registry @robgietema
- Add addable actions and conditions to routes @robgietema
- Add workflow transitions vocabulary @robgietema
- Add routes to manage actions and conditions on a content rule @robgietema
- Add summary method to content rules @robgietema
- Add content rule assignments endpoints @robgietema
- Add assignments to content rule endpoints @robgietema
- Return acquired content rules @robgietema
- Trigger content rules @robgietema
- Add content rule condition handlers @robgietema
- Add content rule action handlers @robgietema
- Add rss support @robgietema
- Add feed content type @robgietema
- Add video content type @robgietema
- Add push api @robgietema
- Add ai response to search endpoint if requested @robgietema
- Add markdown support @robgietema
- Add streaming support for the video content type @robgietema
- Add exportimport script to migrate data @robgietema
- Add context navigation endpoint @robgietema
- Add depth option to navigation endpoint @robgietema
- Add commenting @robgietema
- Add fields vocabulary @robgietema
- Add form support @robgietema
- Add is referencing catalog index @robgietema
- Add link integrity endpoint @robgietema
- Add recycle bin functionality @robgietema
- Add recycle bin endpoints @robgietema
- Change format of system endpoint @robgietema
- Profiles are now specified by package name and profile name @robgietema
- Check accept header on returning content @robgietema
- Add block registry @robgietema
- Add scheduled jobs @robgietema
- Add job queue runner @robgietema
- Add translations from Polyglot project @erral
- Add replace endpoint @robgietema
- Add health check endpoint @robgietema
- Add xss filtering for html blocks @robgietema
- Add s3 storage support @robgietema
- Make blob storage pluggable @robgietema
- Add enabled to scheduled task @robgietema
- Add inline download to all file endpoints @robgietema
- Add custom variable support in config @robgietema
- Add support for float indexes @robgietema
- Read auth token from either the header or from a cookie @robgietema
- Make the search batch size limit configurable via requestLimit.batch @robgietema
- Add custom upgrade code support via index.ts in upgrade steps @robgietema
- Add support for multipart/form-data in content POST and PATCH requests @mamico
- Export workflow definitions, type workflows and the state of documents without workflow @martior
- Export the workflow history of documents @martior
- Export the versions of documents @martior
- Export local roles and the inherit flag of documents @martior
- Export files and images of documents and import profile files with filename and content type @martior
- Export relations with uuids and make links in exported documents relative to the site root @martior
- Export translations of documents @martior
- Export redirects @martior
- Export comments of documents @martior
- Export site title, robots.txt and language settings @martior
- Convert querystring operations of collections and listing blocks in export @martior
- Support the title and token filters and batching in the vocabularies endpoint @martior
- Add the plone.app.vocabularies names Volto uses and the principals, timezones, weekdays, months and metadata fields vocabularies @martior
- Add the `AuthenticatedUsers` group of all authenticated users, like Plone's: it is always listed in @sharing, and local roles given to it apply to every logged-in user, also in search @martior
- Add field and fieldset lookup (`@types/<type>/<name>`) and through-the-web schema changes to @types: POST adds a field or a fieldset, PATCH changes it and DELETE removes it, like plone.restapi @martior
- Run jobs from a Postgres queue: workers claim the oldest job with `FOR UPDATE SKIP LOCKED`, hold a lease renewed by a heartbeat (jobs of a crashed worker are retried), retry failed jobs with exponential backoff up to `jobs.maxAttempts` and support idempotency keys. Jobs run in the worker process by default (`jobs.isolation`) @martior
- Add the `nick` command with `--modules=migrate,api,worker` (default: all) to run the API, the job worker and migrations in one process or split over several; `migrate` runs the knex migrations, installs new profiles and runs profile upgrades under an advisory lock and exits non-zero on errors @martior
- Read the port from the `PORT` environment variable @martior
- Run every profile upgrade step in its own transaction and record it as the profile version, so a failed upgrade keeps the steps before it and resumes at the failed step @martior
- Add a production Dockerfile: multi-stage, production dependencies only, non-root, `nick` as entrypoint and a health check on @health @martior
- Support S3-compatible blob storage (MinIO, R2, Ceph) with the `s3.endpoint` and `s3.forcePathStyle` settings, read the blob and S3 settings from `BLOBS` and `S3_*` environment variables, use the default AWS credential chain without static keys and reuse one S3 client @martior
- Add a Postgres rate limit store (`rateLimit.store: postgres` or `RATE_LIMIT_STORE=postgres`), so rate limits count across API processes; the default stays in memory per process @martior
- Profiles can declare `dependencies` in their metadata.json. Nick loads, installs and upgrades the profiles in dependency order, adds dependencies that are not listed and refuses dependency cycles. The `PROFILES` environment variable (comma separated) replaces `profiles` of `config.ts` @martior
- Rename the examplecontent profile back to default, matching its id. Without `profiles` in `config.ts` the default profile is installed, with core as its dependency, and multilingualcontent depends on multilingual @robgietema
- Every package (core, add-on or project) has its own migration chain: the knex migrations in `nick.migrations` of its package.json, its own ledger `knex_migrations_<package>` and optionally its own Postgres schema (`nick.schema`). `nick --modules=migrate` runs core's chain and then the chains of the packages of the profiles in dependency order, every migration in its own transaction, so a failed migration exits non-zero and the next run resumes with it @martior
- Add batched, resumable data migrations: `migrateInBatches` commits every batch with its cursor in the new `migration_progress` table, so an interrupted data migration resumes after its last batch; registered data migrations can also run on the job queue (`registerDataMigration`, `queueDataMigration`). Run `pnpm migrate` @martior
- `@plone/nick` exports a typed public API for add-ons and projects: the registries (behaviors, blocks, blobs, content rules, events, middleware, models, routes, scheduled jobs, seeds, vocabularies), `Model`, configuration, request, job, profile and migration helpers and their types, with an `exports` map. Deep imports like `@plone/nick/src/routes` still work but are deprecated @martior
- Add `enable_self_reg` and `enable_user_pwd_choice` to the security control panel: anonymous users can register themselves when self-registration is enabled, cannot set roles or groups, and their password is kept when they may choose it, like in Plone. Run `pnpm seed:upgrade` (upgrade 1015) @martior
- Add `pnpm migrate:check`: it migrates a scratch database from scratch, installs the profiles and fails when migrate fails, when a second run changes the schema, when a model has no table or when the schema differs from the committed snapshot `src/migrations/schema.snapshot.txt` (which includes the catalog columns profiles create). `nick --modules=migrate --check-schema` compares a live database with the snapshot. CI runs the check @martior
- The Docker image installs the profiles listed in the `PROFILES` environment variable, so it runs without a mounted config.ts, and can include add-ons of the repository with `--build-arg ADDONS="packages/nick-example-addon"` @martior

### Bugfix

- Accept Zope's `:list` form for query parameters and all three forms of `expand` that plone.restapi accepts (`expand:list=a&expand:list=b`, `expand=a,b` and `expand=a&expand=b`), so Aurora pages get their navigation, breadcrumbs and actions and a repeated `expand` is no longer a 500 @mpalomaki
- New content gets the language of its container when the request doesn't send one, like plone.app.multilingual, instead of no language @robgietema
- Apply the `files` request limit to content created or updated with uploaded files in a JSON body; the global JSON parser with the `api` limit parsed every body first, so uploads were capped at the `api` limit @mpalomaki
- Run `pnpm start` with `NODE_ENV=development`, so the development secret is used and logins stay valid when nodemon restarts Nick; without it every restart used a new random secret and logged everyone out @robgietema
- Fix a typo in the demo content: "is built with" @robgietema
- Serve the last bytes for a suffix range (`bytes=-500`) on `@@videos` instead of the first bytes, and answer a range outside of the file with `416 Range Not Satisfiable` @robgietema
- Make the ids of the documents in a folder unique in the database (documents in the recycle bin excepted), so imports and bulk loads can't create documents that can't be reached; a duplicate id gives 400. Run `pnpm migrate`; the migration lists the duplicate ids and stops if there are any, rename or remove those documents first @martior
- Leave out the ancestors the user may not view from @breadcrumbs, so the titles of private folders don't leak @martior
- Check the email address on PATCH @users like on create, an invalid one gives 400 @martior
- Answer @sharing entries for users or groups that don't exist with 400 instead of ignoring them @martior
- Answer @search with an invalid `b_start`, `b_size`, `path.depth` or date with 400 instead of ignoring the value; a negative `b_start` is still the start, like in Plone @martior
- Answer reordering with an unknown `obj_id` or an invalid `delta` with 400 instead of ignoring it @martior
- Answer `@history` requests with a version that is not a number with 404 and a revert without a valid version with 400 instead of 500 @martior
- Change behavior to snake case @robgietema
- Remove authentication header from breadcrumbs call in docs @robgietema
- Read config file from working directory @robgietema
- Read knex file from working directory @robgietema
- Create subfolders when blobstorage folders don't exist @robgietema
- Fix file download extensions @robgietema
- Fix exclude from nav in navigation call @robgietema
- Index documents after all documents have been seeded @robgietema
- Fix get title handler @robgietema
- Fix seeds when image is not provided @robgietema
- Read position in parent in update content call @robgietema
- Apply behaviors to children in get content call @robgietema
- Reindex parent after delete @robgietema
- Fix addable in types endpoint @robgietema
- Fix import order of profiles @robgietema
- Fix test runner for projects @robgietema
- Fix project vocabularies @robgietema
- Fix password reset link @robgietema
- Fix serving videos @robgietema
- Fix related items in get call @robgietema
- Update workflow from seeds when already exists @robgietema
- Return default layout for content objects @robgietema
- Fix delete within transaction @robgietema
- Fix keywords endpoint @robgietema
- Fix supported languages endpoint @robgietema
- Fix site logo @robgietema
- Make it compatible with Volto without special settings @davisagli
- Fix catalog vocabulary @robgietema
- Fix bug with question marks in titles @robgietema
- Fix querystring search field specification bug @robgietema
- Fix querystring search text search @robgietema
- Add streaming chat call @robgietema
- Move to qwen3 modal @robgietema
- Move assistant from generate to chat endpoint @robgietema
- Reduce jwt expiration to 2 hours @robgietema
- Specify jwt algorithm explicitly @robgietema
- Fix inherit roles on seed @robgietema
- Fix to get own user info @robgietema
- Fix only return restricted children on get content @robgietema
- Fix AI search parameter in sql statement @robgietema
- Force jwt verify to HS256 @robgietema
- Limit path.depth to 20 @robgietema
- Fix password reset email text @robgietema
- Set trust proxy to correct value @robgietema
- Add api limiter to like sql query calls @robgietema
- Set b_size upper limit @robgietema
- Check range for limit and offset values @robgietema
- Set minimum password length to 8 @robgietema
- Set correct allow origin on streaming endpoints @robgietema
- Check for secret in production mode @robgietema
- Added additional directives to request header @robgietema
- Remove newlines form email fields @robgietema
- Add a minimum of 2 characters for all like queries @robgietema
- Fix file handling in control panel endpoint @mpalomaki
- Fix allow credentials config setting @robgietema
- Fix cors error with allow credentials and allow origin @robgietema
- Fix bug in linking translations @mpalomaki
- Fix breadcrumbs call in multilingual site @mpalomaki
- Check uuid on file read @robgietema
- Check if content type exists on add document @robgietema
- Fix bug when uploading an image @robgietema
- Fix issue with language not saved on document update @robgietema
- Fix exclude from nav bug @robgietema
- Fix issue with layouts in types endpoint @robgietema
- Fix issue with sharing @robgietema
- Narrow down the `config.blobs` type to only allow 'file' or 'db' @sneridagh
- Fix error with translation unlinking @robgietema
- Fix error with language locator for languageroots @robgietema
- Remove /++api++ from request url @robgietema
- Fix markdown indexer bug @robgietema
- Fix from address in email handlers @robgietema
- Fix related items bug @robgietema
- Bff fixes for Aurora @sneridagh
- Fix issue with package resolve when using Nick as a dep @robgietema
- Fix a bug when editing the root document @mpalomaki
- Add position in parent to export script @robgietema
- Return username in user endpoints @robgietema
- Fix bug when uploading images and files @robgietema
- Fix bug with empty reset password @mpalomaki
- Fix password reset link @mpalomaki
- Fix unique user error @mpalomaki
- Fix issue with slash in id @mpalomaki
- Fix issue with empty text indexing @mpalomaki
- Fix issue with pdf indexing @mpalomaki
- Fix breadcrumbs with navroots @mpalomaki
- Fix job runner import @robgietema
- Fix transaction bug in jobs @robgietema
- Fix navroot structure @robgietema
- Fix PostgreSQL 18 volume mount @sneridagh
- Fix mail debug print link issue @robgietema
- Only serve images by uuid that belong to the item, its versions or a control panel, so private images can't be read through another item @martior
- Only show uploaded files inline when their content type is safe to show inline, so uploaded html can't run scripts on the api origin @martior
- Skip ancestors the user can't view in the @inherit endpoint @martior
- Only list items the user can view in the @navroot endpoint @martior
- Only list items and breaches the user can view in the @linkintegrity endpoint @martior
- Only serialize related items the user can view in relation list fields @martior
- Don't return stored passwords like the ESMTP password in control panels @martior
- Only list subjects of items the user can view in the subjects vocabulary @martior
- Require the View permission on the item to read, add or reply to comments @martior
- Only list translations the user can view, and require Modify on the other item to link or unlink translations @martior
- Fix copying a folder into its own subfolder, which recursed without end @martior
- Hide expired and not yet effective items in @search and @querystring-search from users who can't edit the context @martior
- Refuse to move items locked by another user, and don't copy the lock of an item to its copy @martior
- Use dedicated single-use tokens for password resets, login tokens can no longer reset a password @martior
- Only revoke a local role on the item itself in the @sharing endpoint, not on every item @martior
- Require the View permission to stream videos with @@videos @martior
- Skip sources the user can't view in @copy and @move, and require Modify on the source to move it @martior
- Fix non ascii image filename @martior
- Fix document urls in export and import of ids containing dots @martior
- Paginate search, users and groups in export, plone.restapi 10 batches users @martior
- Keep core users, roles, permissions and actions when importing an exported profile and map Plone roles to Nick roles @martior
- Give every exported user its own random password instead of one shared password @martior
- Stop the export on failed requests, read groups unbatched and skip comments in the document listing @martior
- Export type behaviors, allowed content types and unlisted types, so exported documents can be traversed @martior
- Fix import of exported groups without email @martior
- Allow descriptions longer than 255 characters for workflows, types and groups @martior
- Return the comments of workflow transitions in @history @martior
- Keep the folder order of exported documents and fix the import of position 0 @martior
- Replace lists instead of merging them by index when seeding controlpanels @martior
- Support plone.app.querystring operation names in querystring search @martior
- Fix server error on searchable text with multiple words or operators @martior
- Support keyword, path query and range parameters in search @martior
- Fix search items total and add batching links with a default batch size of 25 @martior
- Update the catalog paths of the children of a moved or renamed folder @martior
- Support fullobjects and metadata_fields in search and add description to the search results @martior
- Add the GET variant of the querystring search endpoint @martior
- Ignore accents in text search @martior
- Return plone.app.querystring operation names, vocabulary values and sort indexes in the querystring endpoint @martior
- Return the navigation root url as the breadcrumbs root @martior
- Add description to navigation items and return a bad request on an invalid navigation depth @martior
- Include users and groups with a local role and the owner in the search permissions when the workflow state gives that role View @martior
- Reindex the search permissions of the item and its children after a change of local roles or inheritance in @sharing, in a job for large subtrees @martior
- Prefix users and groups in the catalog permissions as `user:` and `group:`, so a user or group named like a role no longer sees items that role may view; run `pnpm seed:upgrade` to rebuild them @martior
- Check workflow transitions against the current state and the permissions on every child with `include_children`, return 400 for unknown or unavailable transitions and require View @martior
- Require the new Revert permission to revert to a previous version, report it in `may_revert`, reindex after a revert and keep the path of top level items; run `pnpm seed:upgrade` to add it @martior
- Ignore a workflow history sent when creating content and only allow site managers to choose the uuid @martior
- Keep the content, children, versions and jobs of a deleted user instead of deleting them, the owner and actor are set to null @martior
- Lock the user while storing or removing a token, so concurrent logins of one user no longer invalidate each other's tokens @martior
- Lock the document for changes and the parent for changes of its children, so concurrent edits no longer fail on duplicate versions and concurrent creates and deletes in one folder no longer deadlock @martior
- Run a request again, up to three times, when its transaction hits a database deadlock or serialization failure instead of returning 500 @martior
- Accept @sharing posts without entries or inherit, ignore unknown roles and return 400 instead of 500 for invalid sharing data @martior
- List users and groups with local or acquired roles in the @sharing entries and search principals by id too @martior
- Unlock content on DELETE @lock and let a forced unlock steal a stealable lock of another user @martior
- Keep the token, timeout and stealable setting when refreshing a lock and don't lock unlocked content on refresh @martior
- Keep the lock when locked content is saved with the lock token @martior
- Return 403 "Resource is locked." when locked content is saved without the lock token @martior
- Refuse to delete locked content with 423 Locked unless the lock token is provided @martior
- Return the existing lock when locking content locked by another user @martior
- Return the existing lock when unlocking content locked by another user without force @martior
- Give every token a unique id, so logging out one session no longer logs out other sessions of the user @martior
- Treat the token of a deleted user as anonymous instead of failing with a server error @martior
- Set the password of a user on PATCH @users and apply the password policy @martior
- Answer 400 instead of 401 or 500 when a password is missing or too short on @users @martior
- Answer 403 when resetting a password with a wrong old password or for another user instead of a silent 200 @martior
- Answer 400 instead of 500 when a group is created without a name, with an existing name or with unknown roles or users @martior
- List the members of a group in GET @groups/<id> @martior
- Search groups case insensitive and support the limit parameter on @groups @martior
- Answer 404 when deleting or updating a user or group that doesn't exist @martior
- Let users update their own properties with PATCH @users @martior
- Refuse an invalid email address when creating a user @martior
- Return the Location header when creating a user or group @martior
- Allow one-character `query` and `search` values on @users like Plone, as Volto searches on every keystroke @martior
- Support the categories:list parameter of @actions @martior
- Refuse aliases which are relative or the path of existing content or of another alias @martior
- Sort types and behaviors by id in @types and the types control panel, so their order doesn't change after an upgrade @robgietema
- Fix the client used in the documentation examples: create its methods once the profiles are initialized, use the default language and pass the lock token @robgietema
- Validate content on create and update like plone.restapi: field types, required fields, text lines and maximum lengths (the title is a text line of at most 1024 characters, upgrade 1013), and explicit ids; a missing `@type` is a 400 and an unknown `@type` a 403. Text is normalized to NFC. Run `pnpm seed:upgrade` @martior
- Allow ids, paths and titles longer than 255 characters instead of failing with a 500 (new migration, run `pnpm migrate`); ids generated from a title are at most 255 characters @martior
- Accept the uuid of new content as `UID` like plone.restapi, and answer an invalid or used uuid with a 400 instead of a 500 @martior
- Add the `parent` summary to content (also to `fullobjects` items), the `Location` header on create and `Prefer: return=representation` on update, like plone.restapi; folder items always have a `description` @martior
- Support `subset_ids` and `sort` when ordering content, ignore an unknown `obj_id` instead of moving another item, keep a negative delta in range, and apply other fields sent with the ordering in the same PATCH @martior
- Name copies and moved items whose id is taken `copy_of_<id>` like Plone instead of `<id>-1` @martior
- Set the `effective` and `expires` dates sent with a workflow transition (also on children with `include_children`), refuse invalid dates with a 400, set the effective date when content is published the first time, and answer a POST to `@workflow` without a transition with a 400 instead of a 404 @martior
- Store the comment of a workflow transition and return the workflow history in `@workflow` (it was always empty) @martior
- Shape `@history` like plone.restapi: list the creation as a `Create` entry, give versions without a change note `null` comments, say 'revision' in the revert comment, add `version` to content (`current`) and to old versions, and answer an unknown version with a 404 @martior
- Record the creation of content as the first workflow history entry (without action) like Plone, instead of deriving a `Create` entry, so migrated histories are shown unchanged @martior
- Add the `disabled` flag to @sharing entries, `true` for the entry of the current user, like Plone @martior
- @types is only available to authenticated users, list items have `id` and `immediately_addable`, and the schema has `type: object` and the content type `application/json+schema`, like plone.restapi @martior
- Sort the @types list on the translated title, like Plone @martior
- Record failed jobs as `failed` instead of `completed`, add the result location to completed jobs and return 404 when aborting an unknown job @martior
- Fix scheduled jobs reusing the committed request transaction after they were created, changed or deleted through the API @martior
- Run a scheduled job once per time slot with any number of processes: only worker processes schedule jobs, importing the app no longer starts the scheduler, and each slot adds its job with a unique key @martior
- Exit with a non-zero code when `pnpm seed` or `pnpm seed:upgrade` fails @martior
- Stop an aborted job right away by cancelling its running database query, and do not log an aborted job as retried @martior
- The default profiles are `@plone/nick:core` only; the default `@plone/nick:default` profile never existed @martior
- Find the core migrations when there is no knexfile.ts in the working directory @martior
- Index the keyword catalog columns (Subject, isReferencing, block_types, ...) with GIN instead of btree, so keyword queries such as a listing by Subject can use their index on large sites; the permission tokens keep their btree index. Run `pnpm migrate` @martior
- Index the paths of documents and the catalog with the pattern operator class and query subtrees with `LIKE` prefixes instead of `starts_with` and regular expressions, so path and `path.depth` queries use an index. Run `pnpm migrate` @martior
- Moving, renaming or deleting (with the recycle bin) an item no longer touches siblings whose id starts with the same text (`/news` and `/newsletter`), paths with quotes no longer break the move, and subtree queries in moves, deletes, sharing and link integrity use the path index instead of regular expressions @martior
- Resolve a path with a constant number of queries instead of four per level (one query for the documents along the path, one or two for the local roles and one for the types), and stop fetching the anonymous user twice per request @martior
- Fix the reindex job action, which did nothing for a single type and failed for a list of types: it now reindexes the documents of the given types (all documents without types) in batches of 500, each written with one statement in its own transaction, with the types, indexes and local roles fetched once instead of per document, and stops when the job is aborted @martior
- Order search results without `sort_on` by the primary key instead of the unindexed UID metadata column (the same order), so a batch of results no longer sorts every match, and collect more statistics for the full text and keyword catalog columns, so Postgres still uses the full text index for rare words. Run `pnpm migrate` @martior
- Filter the viewable children of a folder in linear time instead of comparing every child with every catalog entry, which took seconds for folders with thousands of items @martior
- Skip the catalog query for the children of content without children and reuse the already fetched type when fetching children, two queries less per request for most pages @martior
- Fetch the user of a request with its roles and groups, and the types along the path with their workflows, with one joined query each instead of one query per relation @martior
- Count search results faster: a catalog index by type and state that includes the permission columns and Subject lets Postgres count listings by type, state and subject and searches of the whole site without reading the catalog rows, and a search of the whole site no longer adds a path condition. Run `pnpm migrate` @martior
- Filter search results before sorting them when the search matches at most 5000 items, so a selective search no longer walks an index in sort order through most of the catalog @martior

### Internal

- Update the indirect dependencies in the lockfile to their latest compatible versions, which fixes the vite and postcss security advisories of the test tooling @robgietema
- Upgrade dependencies to their latest versions, including objection 4, nodemailer 10 and vitest 5; typescript stays at 6.0.3 until typescript-eslint supports TypeScript 7 @robgietema
- Upgrade @formatjs/intl to 6.1.4 @robgietema
- Upgrade express to 5.3.0 @robgietema
- Reword the descriptions of the self-registration settings of the security control panel in Nick's own words @martior
- Add a workflow conformance test: every state, transition and role of the standard Plone 6.2 workflows, loaded from their definition.xml, against a matrix captured from Plone 6.2 over HTTP. The GPL-licensed definitions are not included, the test reads them from the checkouts in `PLONE_WORKFLOWS_DIR` and is skipped without it @martior
- Test the DCWorkflow loader, the workflow seed and `@worklists` with workflow definitions written for Nick instead of copies of Plone's (GPL-2.0) @martior
- Upgraded dependencies @robgietema
- Update node dependency requirement @robgietema
- Split profiles in core and default @robgietema
- Move apply behaviors to the document class @robgietema
- Node 22 support @sneridagh
- Fetch indexes from database @robgietema
- Node 23 support @robgietema
- Add support for typescript @robgietema
- Move to ts-node in favor of babel @robgietema
- Upgrade to Express 5 @robgietema
- Remove body-parser and use express buildin json parser @robgietema
- Node 24 support @robgietema
- Upgrade to pnpm @robgietema
- Add logging for log in attempts @robgietema
- Harden CORS settings @robgietema
- Don't expose stack trace on error in production @robgietema
- Add coverage threshold @robgietema
- Remove barrel files @robgietema
- Remove require for the config @robgietema
- Replace lodash with es-toolkit and native functions @robgietema
- Upgrade pdf-parse @robgietema
- Set locales dir as config @robgietema
- Moved from jest to vitest @robgietema
- Move from commonjs to esm @robgietema
- Moved example frontend to separate repository @robgietema
- Refactor events @robgietema
- Refactor ai endpoints with own permission @robgietema
- Log error if document already shared @robgietema
- Convert all files to typescript @robgietema
- Don't expose layout and behaviors on schema if empty @robgietema
- Moved file handling to async @robgietema
- Check migrations and profile upgrades on startup @robgietema
- Make it possible to overwrite models @robgietema
- Register event handler for content rules @robgietema
- Pass remaining params in client to params object @robgietema
- Upgrade node versions to supported versions @robgietema
- Refactor events to use profile init @robgietema
- Refactor tasks to use profile init @robgietema
- Refactor vocabularies to use profile init @robgietema
- Refactor middleware to use profile init @robgietema
- Refactor seeds to use profile init @robgietema
- Refactor behaviors to use profile init @robgietema
- Refactor content rules to use profile init @robgietema
- Refactor routes to use profile init @robgietema
- Refactor models to use profile init @robgietema
- Rename default profile to examplecontent @robgietema
- Fix initialization for client @robgietema
- Save controlpanel and userschema files as blobs @robgietema
- Add a test helper to create users with a login token @martior
- Move the dependabot configuration out of the workflows folder, where it failed as a workflow on every push @martior
- Fix TypeScript type errors @martior
- Remove the unused `Document.fetchLocalUsersGroups` @martior
- Add a `typecheck` script and run it in CI @martior
- Check in CI that the previous version migrates and upgrades to the pushed version @martior
- Move nodemon to the development dependencies @martior
- Run the development docker-compose service from the node image @martior
- Add the example add-on `packages/nick-example-addon`: a content type, a behavior, REST services, a scheduled job, a table in its own schema and two migrations in its own chain, with tests that install it and use every extension point, and a test that a broken data migration fails migrate and resumes after the fix @martior
- Fetch the type and the children of a document one after the other instead of in parallel, so a request transaction no longer runs two queries at once on its connection (pg warns about this and pg 9 refuses it) @martior

### Documentation

- Use the `default` profile instead of the old `examplecontent` name in the deployment docs and the Dockerfile, and say that the image installs the demo site with an `admin`/`admin` user without `PROFILES` @robgietema
- Use a worklist of Nick's own in the workflow and `@worklists` examples @martior
- Document that `checkPermission` in workflow expressions is a Nick extension, Plone's DCWorkflow guards don't have it @martior
- Added documentation for AI support @robgietema
- Rearranged documention into sections @robgietema
- Use different documention theme @robgietema
- Add expansion documentation @robgietema
- Add multilingual documention @robgietema
- Extended search docs with extra examples @robgietema
- Restructure documentation in to admin and dev docs @robgietema
- Write developer docs for all possible customizations @robgietema
- Add documentation for blobs @robgietema
- Add documentation about html filtering @robgietema
- Add documentation about how to setup health checks @robgietema
- Add documentation about how to setup the recyclebin @robgietema
- Add documentation on how to setup limits @robgietema
- Add documentation on how to setup caching @robgietema
- Add documentation about profiles @robgietema
- Document what the Plone migration migrates, what it doesn't and how to verify it @martior
- Fix the url of the update scheduled job example @martior
- Add the jobs admin guide @martior
- Add the deployment admin guide @martior
- Document which state is per process when Nick runs several API processes @martior
- Add the add-ons developer guide (package layout, profile dependencies, public API, per-package migrations and schemas, batched data migrations, drift check, testing) and mark deep imports as deprecated @martior

## 2.8.0 (2022-07-17)

### Feature

- Add sample config file for frontend and backend @robgietema
- Add backend prefix option @robgietema
- Fix frontend favicons @robgietema
- Add support for behavior mixins for documents @robgietema
- Add id from title behavior @robgietema

### Bugfix

- Fix system test @robgietema
- Fix production build @robgietema
- Fix https passthrough for proxy servers @robgietema

### Internal

- Added tests for format helpers. @robgietema
- Added tests for i18n helpers. @robgietema
- Added tests for url helpers. @robgietema
- Removed unused stringify method. @robgietema
- Upgrade packages. @robgietema
- Updated translations. @robgietema
- Update i18n @robgietema
- Add eslint @robgietema
- Add github actions @robgietema
- Rename branch to main @robgietema
- Added tests to github actions @robgietema
- Add Code of Conduct @robgietema
- Added contributing information @robgietema
- Add security policy @robgietema
- Add support information @robgietema

## 2.7.0 (2022-05-05)

### Feature

- Generate querystring endpoint based on indexes. @robgietema
- Added index data from catalog profile. @robgietema
- Added index model. @robgietema
- Added subjects vocabulary. @robgietema
- Added workflow states vocabulary. @robgietema

### Internal

- Upgrade dependencies. @robgietema
- Reorder configuration. @robgietema

### Documentation

- Fix installation instructions. @robgietema

## 2.6.0 (2022-05-04)

### Feature

- Remove items from navigation and search if you don't have the permission. @robgietema
- Added schema based controlpanels. @robgietema
- Added language controlpanel. @robgietema

### Bugfix

- Fixed language vocabulary. @robgietema

### Internal

- Added allowed users, groups and roles index. @robgietema
- Move controlpanels to separate files. @robgietema
- Use language settings from control panel. @robgietema
- Use mail settings from control panel. @robgietema
- Reorder configuration. @robgietema

## 2.6.0 (2022-05-03)

### Feature

- Add exclude from navigation behavior. @robgietema

### Bugfix

- Update translations. @robgietema
- Fix folder contents. @robgietema

### Internal

- Remove uuid from version. @robgietema
- Remove dependency on uuid-ossp extension. @robgietema
- Remove uuid from redirect. @robgietema

### Documentation

- Remove uuid-ossp extension from the documentation (not needed anymore). @robgietema

## 2.5.0 (2022-05-03)

### Feature

- Index documents in the catalog. @robgietema
- Add catalog model. @robgietema

### Bugfix

- Fix date fields. @robgietema
- Fix catalog (re)index. @robgietema

### Internal

- Convert jsonb fields to array fields. @robgietema
- Make search use the catalog. @robgietema

## 2.4.1 (2022-04-14)

### Bugfix

- Fix copy images/files. @robgietema
- Fix catalog indexes. @robgietema

## 2.4.0 (2022-04-13)

### Feature

- Added website. @robgietema
- Add favicon. @robgietema
- Add email notification routes. @robgietema
- Add system endpoint. @robgietema
- Added database endpoint. @robgietema

### Bugfix

- Fix site theming. @robgietema
- Fix translations. @robgietema

### Internal

- Refactor tests. @robgietema

### Documentation

- Added i18n documentation. @robgietema

## 2.3.0 (2022-04-12)

### Feature

- Add workflow history to documents. @robgietema
- Add password reset. @robgietema
- Add user registration. @robgietema
- Add filter content types. @robgietema
- Add sharing via local roles. @robgietema
- Added inherit roles. @robgietema
- Add copy / move route. @robgietema

### Bugfix

- Fix translations. @robgietema

### Internal

- Added translations. @robgietema
- Moved blob storage to var. @robgietema
- Removed unused code. @robgietema
- Upgrade knex. @robgietema

### Documentation

- Updated documentation. @robgietema

## 2.2.0 (2022-04-10)

### Feature

- Added vocabularies. @robgietema
- Added email route. @robgietema

### Internal

- Tests run in transactions. @robgietema
- Upgraded packages. @robgietema

### Documentation

- Added api documentation. @robgietema
- Added more documentation. @robgietema
- Added groups and roles documentation. @robgietema
- Added documentation. @robgietema

## 2.1.0 (2022-04-06)

### Feature

- Added transactions to api calls. @robgietema

### Bugfix

- Handle JWT error. @robgietema
- Remove response from view handlers. @robgietema
- Fix tests. @robgietema
- Fix translations. @robgietema

### Internal

- Refactor main app. @robgietema
- Move traverse to model. @robgietema
- Refactor view handlers. @robgietema
- Added translations. @robgietema
- Swap front- and backend, backend is now the root. @robgietema
- Cache schema in db. @robgietema
- Convert seeds to objection. @robgietema

### Documentation

- Fix readme. @robgietema

## 2.0.0 (2022-04-03)

### Breaking

- Added objection. @robgietema
- Refactor action/workflow to objection. @robgietema
- Refactor types to objection. @robgietema
- Refactor groups to objection. @robgietema
- Added update and delete methods to base model. @robgietema
- Converted user to objection. @robgietema
- Complete objection migration. @robgietema

### Internal

- Remove related links. @robgietema
- Refactor fetching permissions from user, groups and document. @robgietema
- Remove unused code from bookshelf. @robgietema

## 1.5.0 (2022-03-25)

### Feature

- Add behaviors. @robgietema
- Add folderish behavior. @robgietema
- Add actions endpoint. @robgietema

### Bugfix

- Fix translations. @robgietema
- Fix test. @robgietema

### Internal

- Added types and workflow translations. @robgietema

## 1.4.0 (2022-03-24)

### Feature

- Add blob storage support. @robgietema
- Update and delete files. @robgietema
- Add image handling. @robgietema
- Add revert history item. @robgietema
- Add i18n methods. @robgietema
- Add i18n. @robgietema
- Add translations. @robgietema

### Bugfix

- Structure sidepanel fixes. @robgietema
- Fix image scales. @robgietema

### Internal

- Refactor handle files. @robgietema
- Rename backend to nick. @robgietema

## 1.3.0 (2022-03-20)

### Feature

- Added profiles for importing data. @robgietema
- Add groups to user profiles. @robgietema
- Add sharing/local roles to profiles. @robgietema

### Bugfix

- Fix document profiles. @robgietema
- Make order optional for roles. @robgietema
- Prevent from deleting system groups and users. @robgietema

### Internal

- Remove redirect target from redirect model. @robgietema
- Move document profile imports to separate files. @robgietema
- Remove uuid from users and groups. @robgietema

### Documentation

- Add contents navigation mockup. @robgietema

## 1.3.0 (2022-03-19)

### Feature

- Add locking of documents. @robgietema
- Add ordering endpoint. @robgietema
- Added global roles. @robgietema
- Added groups. @robgietema
- Add users/groups endpoints. @robgietema

### Bugfix

- Fix position in parent field. @robgietema
- Check if item moved is not in sub of document to be moved. @robgietema

### Internal

- Upgrade volto version. @robgietema
- Fix tests. @robgietema
- Remove property case conversion. @robgietema

## 1.2.0 (2022-03-06)

### Feature

- Basic theming the frontend. @robgietema

### Internal

- Add test coverage. @robgietema
- Add more tests. @robgietema

### Documentation

- Added move command. @robgietema
- Add metadata fields to search. @robgietema
- Rewrite to async await from '.then'. @robgietema

## 1.1.0 (2022-03-06)

### Feature

- Extend search endpoint. @robgietema
- Added 301 redirects. @robgietema
- Add review permission. @robgietema
- Added workflows to documents. @robgietema
- Added owner to document. @robgietema
- Added workflow routes. @robgietema

### Bugfix

- Fix redirect. @robgietema

### Internal

- Added api src. @robgietema
- Fixed seeds. @robgietema
- Refactor route handler calls. @robgietema

## 1.0.1 (2022-03-02)

### Feature

- Added blocks to type schema. @robgietema

### Bugfix

- Fix breadcrumbs call. @robgietema
- Fix schema's. @robgietema
- Fix initial content. @robgietema
- Fix test. @robgietema

### Internal

- Added autoreload when code changes. @robgietema
- Upgrade dependency packages. @robgietema
- Upgrade bookshelf. @robgietema

### Documentation

- Fix readme. @robgietema

## 1.0.0 (2018-11-08)

### Feature

- Added authentication to login call. @robgietema
- Added JWT token generation. @robgietema
- JWT authentication. @robgietema
- Added roles and permissions. @robgietema
- Added basic search endpoint. @robgietema
- Add addable types. @robgietema

### Bugfix

- Fix root object calls. @robgietema

### Internal

- Added path to db. @robgietema

## 0.3.0 (2018-11-02)

### Feature

- Add child objects to content endpoints. @robgietema
- Added folderish property to documents. @robgietema

### Bugfix

- Fix add content bug. @robgietema

### Internal

- Fix dependencies. @robgietema

### Documentation

- Added documentation. @robgietema

## 0.2.0 (2018-11-02)

### Feature

- Added navigation endpoint. @robgietema
- Added breadcrumbs endpoint. @robgietema
- Added login endpoints. @robgietema
- Added actions endpoint. @robgietema
- Added layout support. @robgietema

### Bugfix

- Fix login endpoints. @robgietema
- Root fix. @robgietema

## 0.1.0 (2018-11-01)

### Feature

- Get content endpoint @robgietema
- Types endpoints. @robgietema
- Added create content call. @robgietema
- Add update content call. @robgietema
- Add delete content endpoint. @robgietema
