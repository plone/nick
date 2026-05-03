/**
 * Supported languages vocabulary.
 * @module vocabularies/supported-languages/supported-languages
 */

// Type imports
import type { Knex } from 'knex';
import type { Request, VocabularyTerm } from '../../types';

// Internal imports
import languages from '../../constants/languages';
import { objectToVocabulary } from '../../helpers/utils/utils';

/**
 * Returns the supported languages vocabulary.
 * @method supportedLanguages
 * @param {Request} req Request object
 * @param {Knex.Transaction} trx Transaction object
 * @returns {Promise<VocabularyTerm[]>} Array of terms.
 */
export async function supportedLanguages(
  req: Request,
  trx: Knex.Transaction,
): Promise<VocabularyTerm[]> {
  return objectToVocabulary(languages);
}
