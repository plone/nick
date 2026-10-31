/**
 * Main entry point: the public API of Nick for add-ons and projects.
 *
 * Import from `@plone/nick` only. Deep imports like
 * `@plone/nick/src/routes` still work but are deprecated; they are not
 * part of the public API and can change in any release.
 * @module index
 */

// Client
export { Client } from './client';

/**
 * Get the Express app, with the routes of the profiles initialized so far.
 * Importing it initializes the configured profiles and builds the routes,
 * so register additional profiles before (used in tests of add-ons).
 * @method getApp
 * @returns {Promise<Express>} The app.
 */
export const getApp = async () => (await import('./app')).default;

// Registries
export { default as behaviors } from './behaviors';
export { default as blobs } from './blobs';
export { default as blocks } from './blocks';
export { default as contentRules } from './content_rules';
export { default as events } from './events';
export { default as middleware } from './middleware';
export { default as models } from './models';
export { default as routes } from './routes';
export { default as scheduledJobs } from './scheduled_jobs';
export { default as seeds } from './seeds';
export { default as vocabularies } from './vocabularies';

// Models
export { Model } from './models/_model/_model';
export { Collection } from './collections/_collection/_collection';

// Configuration, database and logging
export { default as config } from './helpers/config/config';
export { knex } from './helpers/knex/knex';
export { log } from './helpers/log/log';

// Requests
export { RequestException } from './helpers/error/error';
export { getPath, getRootUrl, getUrl, getUrlByPath } from './helpers/url/url';
export { hasPermission } from './helpers/auth/auth';

// Workflow expressions
export {
  type ExpressionMethod,
  registerExpressionMethod,
} from './helpers/expression/expression';
export { getControlpanelSettings } from './helpers/controlpanels/controlpanels';

// Jobs and data migrations
export { default as jobs } from './helpers/jobs/jobs';
export {
  dataMigrationProgress,
  migrateInBatches,
  queueDataMigration,
  registerDataMigration,
} from './helpers/batches/batches';

// Profiles and migrations
export {
  getPackages,
  getProfiles,
  initProfile,
  initProfiles,
  configuredProfiles,
  readMetadata,
  resolvePackage,
  resolveProfile,
  resolveProfiles,
} from './helpers/profiles/profiles';
export {
  MigrationSource,
  installProfiles,
  migrateChain,
  migrateDatabase,
  migrationChains,
  migrationStatus,
  migrationTable,
  upgradeProfiles,
} from './helpers/migrate/migrate';

// Utilities
export { mapAsync, mapSync, uniqueId } from './helpers/utils/utils';
export { stripI18n } from './helpers/i18n/i18n';

// Types
export type { Knex } from 'knex';
export type { DataMigration, BatchHandler } from './helpers/batches/batches';
export type { MigrationChain } from './helpers/migrate/migrate';
export type { PackageInfo, ProfileInfo } from './helpers/profiles/profiles';
export type {
  Block,
  ContentRuleAction,
  ContentRuleCondition,
  ConfigSettings,
  Json,
  JsonObject,
  MiddlewareHandler,
  NickPackageConfig,
  Params,
  ProfileMetadata,
  Request,
  Route,
  ScheduledJobAction,
  ScheduledJobContext,
  Schema,
  SeedHandler,
  View,
  Vocabulary,
  VocabularyHandler,
  VocabularyTerm,
} from './types';
