/**
 * Vocabulary seed.
 * @module seeds/vocabulary/vocabulary
 */

// Type imports
import type { Knex } from 'knex';

// External imports
import { dropRight } from 'es-toolkit/array';
import { promises as fs } from 'fs';

// Internal imports
import { dirExists } from '../../helpers/fs/fs';
import { stripI18n } from '../../helpers/i18n/i18n';
import { mapAsync } from '../../helpers/utils/utils';
import models from '../../models';

export const seedVocabulary = async (
  trx: Knex.Transaction,
  profilePath: string,
): Promise<void> => {
  const Vocabulary = models.get('Vocabulary');
  if (await dirExists(`${profilePath}/vocabularies`)) {
    // Get vocabulary profiles
    const vocabularies = (await fs.readdir(`${profilePath}/vocabularies`))
      .map((file: string) => dropRight(file.split('.'), 1).join('.'))
      .sort();

    // Import vocabularies
    await mapAsync(vocabularies, async (vocabulary: string) => {
      const data = stripI18n(
        (await import(`${profilePath}/vocabularies/${vocabulary}`)).default,
      );
      await Vocabulary.create(data, {}, trx);
    });
    console.log('Vocabularies imported');
  }
};
