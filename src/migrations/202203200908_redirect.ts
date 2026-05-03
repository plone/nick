/**
 * Redirect migration.
 * @module migration/redirect
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('redirect', (table: Knex.TableBuilder) => {
    table
      .uuid('document')
      .notNullable()
      .references('document.uuid')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    table.string('path').notNullable().index();
    table.primary(['document', 'path']);
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable('redirect');
};
