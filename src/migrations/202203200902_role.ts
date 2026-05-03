/**
 * Role migration.
 * @module migration/role
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('role', (table: Knex.TableBuilder) => {
    table.string('id').primary();
    table.string('title');
    table.integer('order');
  });
  await knex.schema.createTable(
    'role_permission',
    (table: Knex.TableBuilder) => {
      table
        .string('role')
        .notNullable()
        .references('role.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
      table
        .string('permission')
        .notNullable()
        .references('permission.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
      table.primary(['role', 'permission']);
    },
  );
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable('role_permission');
  await knex.schema.dropTable('role');
};
