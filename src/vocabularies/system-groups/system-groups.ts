/**
 * System groups vocabulary.
 * @module vocabularies/system-groups/system-groups
 */

// Type imports
import type { Knex } from 'knex';
import type { Request, VocabularyTerm } from '../../types';

// Internal imports
import config from '../../helpers/config/config';
import { arrayToVocabulary } from '../../helpers/utils/utils';

/**
 * Returns the system groups vocabulary.
 * @method systemGroups
 * @param {Request} _req Request object
 * @param {Knex.Transaction} _trx Transaction object
 * @returns {Promise<VocabularyTerm[]>} Array of terms.
 */
export async function systemGroups(
  _req: Request,
  _trx: Knex.Transaction,
): Promise<VocabularyTerm[]> {
  return arrayToVocabulary(config.settings.systemGroups);
}
