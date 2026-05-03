/**
 * Users vocabulary.
 * @module vocabularies/users/users
 */

// Type imports
import type { Knex } from 'knex';
import type { Request, Vocabulary } from '../../types';

// Internal imports
import models from '../../models';

/**
 * Returns the users vocabulary.
 * @method users
 * @param {Request} req Request object
 * @param {Knex.Transaction} trx Transaction object
 * @returns {Promise<Vocabulary>} Array of terms.
 */
export async function users(
  req: Request,
  trx: Knex.Transaction,
): Promise<Vocabulary> {
  const User = models.get('User');
  const users = await User.fetchAll({}, { order: 'fullname' }, trx);
  return users.getVocabulary(req);
}
