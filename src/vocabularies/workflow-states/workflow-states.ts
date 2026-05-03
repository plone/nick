/**
 * Workflows states vocabulary.
 * @module vocabularies/workflows-states/workflows-states
 */

// Type imports
import type { Knex } from 'knex';
import type { Request, VocabularyTerm } from '../../types';

// External imports
import { mapValues } from 'es-toolkit/object';

// Internal imports
import { objectToVocabulary } from '../../helpers/utils/utils';
import models from '../../models';

/**
 * Returns the workflows states vocabulary.
 * @method workflowStates
 * @param {Request} req Request object
 * @param {Knex.Transaction} trx Transaction object
 * @returns {Promise<VocabularyTerm[]>} Array of terms.
 */
export async function workflowStates(
  req: Request,
  trx: Knex.Transaction,
): Promise<VocabularyTerm[]> {
  const Workflow = models.get('Workflow');
  const states = {} as Record<string, string>;
  const workflows = await Workflow.fetchAll({}, { order: 'title' }, trx);

  // Get states
  workflows.map((workflow: any) =>
    mapValues(workflow.json.states, (value, key: string) => {
      states[key] = value.title;
    }),
  );

  // Return states
  return objectToVocabulary(states);
}
