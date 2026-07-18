# Change Log

## 2.9.0 (unreleased)

### Breaking

### Feature

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

### Bugfix

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

### Internal

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

### Documentation

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
