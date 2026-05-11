/**
 * Fields vocabulary.
 * @module vocabularies/fields/fields
 */

// Type imports
import type { Knex } from 'knex';
import type { Request, VocabularyTerm } from '../../types';

// Internal imports
import fieldList from '../../constants/fields';
import { objectToVocabulary } from '../../helpers/utils/utils';

/**
 * Returns the fields vocabulary.
 * @method fields
 * @param {Request} _req Request object
 * @param {Knex.Transaction} _trx Transaction object
 * @returns {Promise<VocabularyTerm[]>} Array of terms.
 */
export async function fields(
  _req: Request,
  _trx: Knex.Transaction,
): Promise<VocabularyTerm[]> {
  return objectToVocabulary(fieldList);
}
