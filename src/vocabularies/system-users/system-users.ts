/**
 * System users vocabulary.
 * @module vocabularies/system-users/system-users
 */

// Type imports
import type { Knex } from 'knex';
import type { Request, VocabularyTerm } from '../../types';

// Internal imports
import config from '../../helpers/config/config';
import { arrayToVocabulary } from '../../helpers/utils/utils';

/**
 * Returns the system users vocabulary.
 * @method systemUsers
 * @param {Request} _req Request object
 * @param {Knex.Transaction} _trx Transaction object
 * @returns {Promise<VocabularyTerm[]>} Array of terms.
 */
export async function systemUsers(
  _req: Request,
  _trx: Knex.Transaction,
): Promise<VocabularyTerm[]> {
  return arrayToVocabulary(config.settings.systemUsers);
}
