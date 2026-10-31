/**
 * Workflow chains of types: the workflows of a type in order, like the
 * chains of the Plone workflow tool. Position 0 is `type.workflow`, the
 * workflow whose state is the review state; the other positions are the
 * further workflows of the chain.
 * @module migration/type_workflow
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('type_workflow', (table: Knex.TableBuilder) => {
    table
      .string('type')
      .notNullable()
      .references('type.id')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    table
      .string('workflow')
      .notNullable()
      .references('workflow.id')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
    table.integer('position').notNullable();
    table.primary(['type', 'workflow']);
  });

  // Every type starts with its workflow
  await knex.raw(
    `INSERT INTO type_workflow (type, workflow, position)
      SELECT id, workflow, 0 FROM type`,
  );
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable('type_workflow');
};
