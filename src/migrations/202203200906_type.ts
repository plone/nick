/**
 * Type migration.
 * @module migration/type
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('behavior', (table: Knex.TableBuilder) => {
    table.string('id').primary().notNullable();
    table.string('title').notNullable();
    table.string('description');
    table.jsonb('schema').notNullable();
  });
  await knex.schema.createTable('type', (table: Knex.TableBuilder) => {
    table.string('id').primary().notNullable();
    table.string('title').notNullable();
    table.string('description');
    table.boolean('global_allow');
    table.boolean('filter_content_types');
    table.specificType('allowed_content_types', 'character varying(255)[]');
    table.jsonb('schema').notNullable();
    table.jsonb('_schema');
    table
      .string('workflow')
      .references('workflow.id')
      .notNullable()
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable('type');
  await knex.schema.dropTable('behavior');
};
