/**
 * Workflow status of documents: the state and the variables of every
 * workflow of a document, like the status DCWorkflow stores per workflow.
 * `document.workflow_state` stays the state of the (first) workflow of the
 * type, the review state.
 * @module migration/document_workflow_status
 */

// Type imports
import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable(
    'document_workflow_status',
    (table: Knex.TableBuilder) => {
      table
        .uuid('document')
        .notNullable()
        .references('document.uuid')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
      table
        .string('workflow')
        .notNullable()
        .references('workflow.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
      table.string('state').notNullable();
      table.jsonb('variables').notNullable().defaultTo('{}');
      table.primary(['document', 'workflow']);
    },
  );
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTable('document_workflow_status');
};
