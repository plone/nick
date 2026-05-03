/**
 * Workflow migration.
 * @module migration/workflow
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('workflow', (table: Knex.TableBuilder) => {
    table.string('id').primary();
    table.string('title').notNullable();
    table.string('description');
    table.jsonb('json').notNullable();
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable('workflow');
};
