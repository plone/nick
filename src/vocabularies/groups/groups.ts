/**
 * Groups vocabulary.
 * @module vocabularies/groups/groups
 */

// Type imports
import type { Knex } from 'knex';
import type { Request, Vocabulary } from '../../types';

// Internal imports
import models from '../../models';

/**
 * Returns the groups vocabulary.
 * @method groups
 * @param {Request} req Request object
 * @param {Knex.Transaction} trx Transaction object
 * @returns {Promise<Vocabulary>} Array of terms.
 */
export async function groups(
  req: Request,
  trx: Knex.Transaction,
): Promise<Vocabulary> {
  const Group = models.get('Group');
  const groups = await Group.fetchAll({}, { order: 'title' }, trx);
  return groups.getVocabulary(req);
}
