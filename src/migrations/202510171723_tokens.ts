/**
 * Tokens migration.
 * @module migration/tokens
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('user', (table: Knex.TableBuilder) => {
    table.specificType('tokens', 'character varying(255)[]');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('user', (table: Knex.TableBuilder) => {
    table.dropColumn('tokens');
  });
};
