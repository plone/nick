/**
 * Actions migration.
 * @module migration/actions
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('action', (table: Knex.TableBuilder) => {
    table.string('id').primary();
    table.string('title');
    table.string('category');
    table.integer('order');
    table
      .string('permission')
      .notNullable()
      .references('permission.id')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable('action');
};
