/**
 * Permission migration.
 * @module migration/permission
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('permission', (table: Knex.TableBuilder) => {
    table.string('id').primary();
    table.string('title');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable('permission');
};
