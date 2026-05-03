/**
 * Controlpanel seed.
 * @module seeds/controlpanel/controlpanel
 */

// Type imports
import type { Knex } from 'knex';

// External imports
import { dropRight } from 'es-toolkit/array';
import { merge } from 'es-toolkit/object';
import { promises as fs } from 'fs';

// Internal imports
import { handleFiles, handleImages } from '../../helpers/content/content';
import { dirExists } from '../../helpers/fs/fs';
import { stripI18n } from '../../helpers/i18n/i18n';
import { mapAsync } from '../../helpers/utils/utils';
import models from '../../models';

export const seedControlpanel = async (
  trx: Knex.Transaction,
  profilePath: string,
): Promise<void> => {
  const Controlpanel = models.get('Controlpanel');
  if (await dirExists(`${profilePath}/controlpanels`)) {
    // Get controlpanel profiles
    const controlpanels = (await fs.readdir(`${profilePath}/controlpanels`))
      .filter((file: string) => file.endsWith('.json'))
      .map((file: string) => dropRight(file.split('.'), 1).join('.'))
      .sort();

    // Import controlpanels
    await mapAsync(controlpanels, async (controlpanel: string) => {
      const data: any = stripI18n(
        (await import(`${profilePath}/controlpanels/${controlpanel}`)).default,
      );

      // Check if controlpanel exists
      let current: any = await Controlpanel.fetchById(data.id, {}, trx);

      // Create control panel if not already there
      if (!current) {
        await Controlpanel.create(data, {}, trx);
      }
      current = await Controlpanel.fetchById(data.id, {}, trx);

      // Handle files and images
      data.data = await handleFiles(
        data.data,
        current,
        trx,
        `${profilePath}/controlpanels`,
      );
      data.data = await handleImages(
        data.data,
        current,
        trx,
        `${profilePath}/controlpanels`,
      );

      // Update record
      await Controlpanel.update(
        data.id,
        merge((current as any).$toDatabaseJson(), data),
        trx,
      );
    });
    console.log('Controlpanels imported');
  }
};
