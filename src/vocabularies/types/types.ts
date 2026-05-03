/**
 * Types vocabulary.
 * @module vocabularies/types/types
 */

// Type imports
import type { Knex } from 'knex';
import type { Request, Vocabulary } from '../../types';

// Internal imports
import models from '../../models';

/**
 * Returns the types vocabulary.
 * @method types
 * @param {Request} req Request object
 * @param {Knex.Transaction} trx Transaction object
 * @returns {Promise<Vocabulary>} Array of terms.
 */
export async function types(
  req: Request,
  trx: Knex.Transaction,
): Promise<Vocabulary> {
  const Type = models.get('Type');
  const types = await Type.fetchAll({}, { order: 'title' }, trx);
  return types.getVocabulary(req);
}
