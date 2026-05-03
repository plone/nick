/**
 * Permissions vocabulary.
 * @module vocabularies/permissions/permissions
 */

// Type imports
import type { Knex } from 'knex';
import type { Request, Vocabulary } from '../../types';

// Internal imports
import models from '../../models';

/**
 * Returns the permissions vocabulary.
 * @method permissions
 * @param {Request} req Request object
 * @param {Knex.Transaction} trx Transaction object
 * @returns {Promise<Vocabulary>} Array of terms.
 */
export async function permissions(
  req: Request,
  trx: Knex.Transaction,
): Promise<Vocabulary> {
  const Permission = models.get('Permission');
  const permissions = await Permission.fetchAll({}, { order: 'title' }, trx);
  return permissions.getVocabulary(req);
}
