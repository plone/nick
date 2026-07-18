/**
 * Job enabled migration.
 * @module migration/job_enabled
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('scheduled_job', (table: Knex.TableBuilder) => {
    table.boolean('enabled').defaultTo(true);
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('scheduled_job', (table: Knex.TableBuilder) => {
    table.dropColumn('enabled');
  });
};
