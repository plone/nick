/**
 * File migration.
 * @module migration/file
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('file', (table: Knex.TableBuilder) => {
    table.uuid('uuid').primary();
    table.binary('data');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable('file');
};
