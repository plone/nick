/**
 * Behaviors vocabulary.
 * @module vocabularies/behaviors/behaviors
 */

// Type imports
import type { Knex } from 'knex';
import type { Request, Vocabulary } from '../../types';

// Internal imports
import models from '../../models';

/**
 * Returns the behaviors vocabulary.
 * @method behaviors
 * @param {Request} req Request object
 * @param {Knex.Transaction} trx Transaction object
 * @returns {Promise<Vocabulary>} Array of terms.
 */
export async function behaviors(
  req: Request,
  trx: Knex.Transaction,
): Promise<Vocabulary> {
  const Behavior = models.get('Behavior');
  const behaviors = await Behavior.fetchAll({}, { order: 'title' }, trx);
  return behaviors.getVocabulary(req);
}
