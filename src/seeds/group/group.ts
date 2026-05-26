/**
 * Group seed.
 * @module seeds/group/group
 */

// Type imports
import type { Knex } from 'knex';

// External imports
import { omit } from 'es-toolkit/object';

// Internal imports
import { fileExists } from '../../helpers/fs/fs';
import { stripI18n } from '../../helpers/i18n/i18n';
import { mapAsync } from '../../helpers/utils/utils';
import models from '../../models';

export const seedGroup = async (
  trx: Knex.Transaction,
  profilePath: string,
): Promise<void> => {
  const Group = models.get('Group');
  if (await fileExists(`${profilePath}/groups`)) {
    const profile = stripI18n((await import(`${profilePath}/groups`)).default);
    if (profile.purge) {
      await Group.delete({}, trx);
    }
    await mapAsync(profile.groups, async (group: any) => {
      await Group.create(
        {
          ...omit(group, ['roles']),
          _roles: group.roles,
        },
        {},
        trx,
      );
    });
    console.log('Groups imported');
  }
};
