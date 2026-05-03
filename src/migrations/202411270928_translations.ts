/**
 * Translations migration.
 * @module migration/translations
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('document', (table: Knex.TableBuilder) => {
    table.uuid('translation_group').index();
    table.string('language').index();
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('document', (table: Knex.TableBuilder) => {
    table.dropColumn('translation_group');
    table.dropColumn('language');
  });
};
