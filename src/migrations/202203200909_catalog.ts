/**
 * Catalog migration.
 * @module migration/catalog
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('catalog', (table: Knex.TableBuilder) => {
    table
      .uuid('document')
      .primary()
      .references('document.uuid')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
  });
  await knex.schema.createTable('index', (table: Knex.TableBuilder) => {
    table.string('id').primary();
    table.string('title');
    table.string('description');
    table.string('group');
    table.boolean('enabled');
    table.boolean('sortable');
    table.jsonb('operators');
    table.string('vocabulary');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable('index');
  await knex.schema.dropTable('catalog');
};
