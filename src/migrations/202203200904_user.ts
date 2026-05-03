/**
 * User migration.
 * @module migration/user
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('user', (table: Knex.TableBuilder) => {
    table.string('id').primary();
    table.string('password').notNullable();
    table.string('fullname');
    table.string('email').unique();
  });
  await knex.schema.createTable('user_role', (table: Knex.TableBuilder) => {
    table
      .string('user')
      .notNullable()
      .references('user.id')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    table
      .string('role')
      .notNullable()
      .references('role.id')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    table.primary(['user', 'role']);
  });
  await knex.schema.createTable('user_group', (table: Knex.TableBuilder) => {
    table
      .string('user')
      .notNullable()
      .references('user.id')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    table
      .string('group')
      .notNullable()
      .references('group.id')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    table.primary(['user', 'group']);
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable('user_group');
  await knex.schema.dropTable('user_role');
  await knex.schema.dropTable('user');
};
