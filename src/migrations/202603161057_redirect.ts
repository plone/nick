/**
 * Redirect migration.
 * @module migration/redirect
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('redirect', (table: Knex.TableBuilder) => {
    table.boolean('manual').defaultTo(false);
    table.dateTime('datetime').defaultTo(knex.fn.now());
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('redirect', (table: Knex.TableBuilder) => {
    table.dropColumn('manual');
    table.dropColumn('datetime');
  });
};
