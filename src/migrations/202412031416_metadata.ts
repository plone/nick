/**
 * Metadata migration.
 * @module migration/metadata
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('index', (table: Knex.TableBuilder) => {
    table.string('name');
    table.string('type');
    table.boolean('metadata').index();
    table.string('attr');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('index', (table: Knex.TableBuilder) => {
    table.dropColumn('name');
    table.dropColumn('type');
    table.dropColumn('metadata');
    table.dropColumn('attr');
  });
};
