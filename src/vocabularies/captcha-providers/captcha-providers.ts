/**
 * Captcha providers.
 * @module vocabularies/captcha-providers/captcha-providers
 */

// Type imports
import type { Knex } from 'knex';
import type { Request, VocabularyTerm } from '../../types';

// Internal imports
import { objectToVocabulary } from '../../helpers/utils/utils';

const providers = {
  'norobots-captcha': 'NoRobots ReCaptcha Support',
};

/**
 * Returns the captcha providers vocabulary.
 * @method captchaProviders
 * @param {Request} req Request object
 * @param {Knex.Transaction} trx Transaction object
 * @returns {Promise<VocabularyTerm[]>} Array of terms.
 */
export async function captchaProviders(
  req: Request,
  trx: Knex.Transaction,
): Promise<VocabularyTerm[]> {
  return objectToVocabulary(providers);
}
