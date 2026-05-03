/**
 * Profile migration.
 * @module migration/profile
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('profile', (table: Knex.TableBuilder) => {
    table.string('id').primary();
    table.string('title');
    table.string('description');
    table.string('version');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable('profile');
};
