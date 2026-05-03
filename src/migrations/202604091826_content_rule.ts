/**
 * Content rule migration.
 * @module migration/content_rule
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('content_rule', (table: Knex.TableBuilder) => {
    table.string('id').primary();
    table.string('title');
    table.text('description');
    table.string('event').index();
    table.boolean('enabled').index();
    table.jsonb('json').notNullable().defaultTo('{}');
  });

  await knex.schema.createTable(
    'content_rule_document',
    (table: Knex.TableBuilder) => {
      table
        .string('content_rule')
        .notNullable()
        .references('content_rule.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
      table
        .uuid('document')
        .notNullable()
        .references('document.uuid')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
      table.boolean('enabled');
      table.boolean('bubble');
      table.primary(['document', 'content_rule']);
    },
  );
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable('content_rule_document');
  await knex.schema.dropTable('content_rule');
};
