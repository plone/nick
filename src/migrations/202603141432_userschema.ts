/**
 * Userschema migration.
 * @module migration/userschema
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('user', (table: Knex.TableBuilder) => {
    table.jsonb('json').notNullable().defaultTo('{}');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('user', (table: Knex.TableBuilder) => {
    table.dropColumn('json');
  });
};
