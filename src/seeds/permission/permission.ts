/**
 * Permission seed.
 * @module seeds/permission/permission
 */

// Type imports
import type { Knex } from 'knex';

// Internal imports
import { fileExists } from '../../helpers/fs/fs';
import { stripI18n } from '../../helpers/i18n/i18n';
import { mapAsync } from '../../helpers/utils/utils';
import models from '../../models';

export const seedPermission = async (
  trx: Knex.Transaction,
  profilePath: string,
): Promise<void> => {
  const Permission = models.get('Permission');
  if (await fileExists(`${profilePath}/permissions`)) {
    const profile = stripI18n(
      (await import(`${profilePath}/permissions`)).default,
    );
    if (profile.purge) {
      await Permission.delete({}, trx);
    }
    await mapAsync(profile.permissions, async (permission: any) => {
      await Permission.create(permission, {}, trx);
    });
    console.log('Permissions imported');
  }
};
