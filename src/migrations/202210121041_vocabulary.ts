/**
 * Vocabulary migration.
 * @module migration/vocabulary
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('vocabulary', (table: Knex.TableBuilder) => {
    table.string('id').primary();
    table.string('title');
    table.jsonb('items').notNullable();
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable('vocabulary');
};
