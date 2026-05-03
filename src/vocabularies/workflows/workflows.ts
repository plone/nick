/**
 * Workflows vocabulary.
 * @module vocabularies/workflows/workflows
 */

// Type imports
import type { Knex } from 'knex';
import type { Request, Vocabulary } from '../../types';

// Internal imports
import models from '../../models';

/**
 * Returns the workflows vocabulary.
 * @method workflows
 * @param {Request} req Request object
 * @param {Knex.Transaction} trx Transaction object
 * @returns {Promise<Vocabulary>} Array of terms.
 */
export async function workflows(
  req: Request,
  trx: Knex.Transaction,
): Promise<Vocabulary> {
  const Workflow = models.get('Workflow');
  const workflows = await Workflow.fetchAll({}, { order: 'title' }, trx);
  return workflows.getVocabulary(req);
}
