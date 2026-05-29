/**
 * Jobs migration.
 * @module migration/jobs
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('job', (table: Knex.TableBuilder) => {
    table.uuid('uuid').primary();
    table.string('title');
    table.text('description');
    table.jsonb('params').notNullable().defaultTo('{}');
    table
      .string('actor')
      .references('user.id')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    table.dateTime('created');
    table.dateTime('started');
    table.dateTime('finished');
    table.string('status');
    table.jsonb('result').notNullable().defaultTo('{}');
  });

  await knex.schema.createTable('scheduled_job', (table: Knex.TableBuilder) => {
    table.string('id').primary();
    table.string('title');
    table.text('description');
    table.string('action');
    table.jsonb('params').notNullable().defaultTo('{}');
    table.string('schedule');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable('scheduled_job');
  await knex.schema.dropTable('job');
};
