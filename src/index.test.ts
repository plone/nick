/**
 * Public API tests.
 * @module index.test
 */

// External imports
import { describe, expect, it } from 'vitest';

// Internal imports
import * as api from '.';
import behaviors from './behaviors';
import models from './models';
import routes from './routes';
import scheduledJobs from './scheduled_jobs';
import vocabularies from './vocabularies';

describe('Public API', () => {
  it('should export the registries used by core', () => {
    expect(api.behaviors).toBe(behaviors);
    expect(api.models).toBe(models);
    expect(api.routes).toBe(routes);
    expect(api.scheduledJobs).toBe(scheduledJobs);
    expect(api.vocabularies).toBe(vocabularies);
  });

  it('should export the same instances through the package name', async () => {
    const pkg = await import('@plone/nick');
    expect(pkg.routes).toBe(routes);
    expect(pkg.models).toBe(models);
  });

  it('should export the documented API', () => {
    expect(Object.keys(api).sort()).toEqual([
      'Client',
      'Collection',
      'MigrationSource',
      'Model',
      'RequestException',
      'behaviors',
      'blobs',
      'blocks',
      'config',
      'configuredProfiles',
      'contentRules',
      'dataMigrationProgress',
      'events',
      'getApp',
      'getControlpanelSettings',
      'getPackages',
      'getPath',
      'getProfiles',
      'getRootUrl',
      'getUrl',
      'getUrlByPath',
      'hasPermission',
      'initProfile',
      'initProfiles',
      'installProfiles',
      'jobs',
      'knex',
      'log',
      'mapAsync',
      'mapSync',
      'middleware',
      'migrateChain',
      'migrateDatabase',
      'migrateInBatches',
      'migrationChains',
      'migrationStatus',
      'migrationTable',
      'models',
      'queueDataMigration',
      'readMetadata',
      'registerDataMigration',
      'registerExpressionMethod',
      'resolvePackage',
      'resolveProfile',
      'resolveProfiles',
      'routes',
      'scheduledJobs',
      'seeds',
      'stripI18n',
      'uniqueId',
      'upgradeProfiles',
      'vocabularies',
    ]);
  });
});
