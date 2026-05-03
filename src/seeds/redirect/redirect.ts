/**
 * Redirect seed.
 * @module seeds/redirect/redirect
 */

// Type imports
import type { Knex } from 'knex';

// Internal imports
import { fileExists } from '../../helpers/fs/fs';
import { stripI18n } from '../../helpers/i18n/i18n';
import models from '../../models';

export const seedRedirect = async (
  trx: Knex.Transaction,
  profilePath: string,
): Promise<void> => {
  const Redirect = models.get('Redirect');
  if (await fileExists(`${profilePath}/redirects`)) {
    const profile = stripI18n(
      (await import(`${profilePath}/redirects`)).default,
    );
    if (profile.purge) {
      await Redirect.delete({}, trx);
    }
    await Promise.all(
      profile.redirects.map(
        async (redirects: any) => await Redirect.create(redirects, {}, trx),
      ),
    );
    console.log('Redirects imported');
  }
};
