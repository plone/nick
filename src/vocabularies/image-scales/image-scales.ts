/**
 * Image scales vocabulary.
 * @module vocabularies/image-scales/image-scales
 */

// Type imports
import type { Knex } from 'knex';
import type { Request, VocabularyTerm } from '../../types';

// Internal imports
import config from '../../helpers/config/config';
import { arrayToVocabulary } from '../../helpers/utils/utils';

/**
 * Returns the image scales vocabulary.
 * @method imageScales
 * @param {Request} _req Request object
 * @param {Knex.Transaction} _trx Transaction object
 * @returns {Promise<VocabularyTerm[]>} Array of terms.
 */
export async function imageScales(
  _req: Request,
  _trx: Knex.Transaction,
): Promise<VocabularyTerm[]> {
  return arrayToVocabulary(Object.keys(config.settings.imageScales));
}
