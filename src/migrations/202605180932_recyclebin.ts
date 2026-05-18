/**
 * Recycle bin migration.
 * @module migration/recyclebin
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('document', (table: Knex.TableBuilder) => {
    table.boolean('deleted').defaultTo(false).index();
  });
  await knex('document').update({ deleted: false }).whereNull('deleted');
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('document', (table: Knex.TableBuilder) => {
    table.dropColumn('deleted');
  });
};
