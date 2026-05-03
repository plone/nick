/**
 * Group migration.
 * @module migration/group
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('group', (table: Knex.TableBuilder) => {
    table.string('id').primary();
    table.string('title');
    table.string('description');
    table.string('email').unique();
  });
  await knex.schema.createTable('group_role', (table: Knex.TableBuilder) => {
    table
      .string('group')
      .notNullable()
      .references('group.id')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    table
      .string('role')
      .notNullable()
      .references('role.id')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    table.primary(['group', 'role']);
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable('group_role');
  await knex.schema.dropTable('group');
};
