/**
 * Available languages vocabulary.
 * @module vocabularies/available-languages/available-languages
 */

// Type imports
import type { Knex } from 'knex';
import type { Request, VocabularyTerm } from '../../types';

// External imports
import { pick } from 'es-toolkit/object';

// Internal imports
import languages from '../../constants/languages';
import { objectToVocabulary } from '../../helpers/utils/utils';
import models from '../../models';

/**
 * Returns the available languages vocabulary.
 * @method availableLanguages
 * @param {Request} req Request object
 * @param {Knex.Transaction} trx Transaction object
 * @returns {Promise<VocabularyTerm[]>} Array of terms.
 */
export async function availableLanguages(
  req: Request,
  trx: Knex.Transaction,
): Promise<VocabularyTerm[]> {
  const Controlpanel = models.get('Controlpanel');

  // Fetch settings
  const controlpanel = await Controlpanel.fetchById('language', {}, trx);
  const settings = (controlpanel as any).data;

  // Return languages
  return objectToVocabulary(pick(languages, settings.available_languages));
}
