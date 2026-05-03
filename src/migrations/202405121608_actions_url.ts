/**
 * Actions url migration.
 * @module migration/actions_url
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('action', (table: Knex.TableBuilder) => {
    table.string('url');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('action', (table: Knex.TableBuilder) => {
    table.dropColumn('url');
  });
};
