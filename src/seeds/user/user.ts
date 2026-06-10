/**
 * User seed.
 * @module seeds/user/user
 */

// Type imports
import type { Knex } from 'knex';
import type { Schema } from '../../types';

// External imports
// @ts-expect-error bcrypt-promise does not have types
import bcrypt from 'bcrypt-promise';
import { omit } from 'es-toolkit/object';

// Internal imports
import config from '../../helpers/config/config';
import {
  handleBlocks,
  handleFiles,
  handleImages,
  handleRelationLists,
} from '../../helpers/content/content';
import { fileExists } from '../../helpers/fs/fs';
import { stripI18n } from '../../helpers/i18n/i18n';
import { mapAsync } from '../../helpers/utils/utils';
import models from '../../models';

const userFields = ['id', 'fullname', 'email'];

export const seedUser = async (
  trx: Knex.Transaction,
  profilePath: string,
): Promise<void> => {
  const User = models.get('User');

  if (await fileExists(`${profilePath}/users`)) {
    const profile = stripI18n((await import(`${profilePath}/users`)).default);
    if (profile.purge) {
      await User.delete({}, trx);
    }
    await mapAsync(profile.users, async (user: any) => {
      let json: any = omit(user, [
        ...userFields,
        'password',
        'roles',
        'groups',
        'id',
        'fullname',
        'email',
      ]);

      // Handle files and images
      const schema: Schema = config.settings.userschema({
        i18n: (key: string) => key,
      } as any);
      json = await handleBlocks(json);
      json = await handleFiles(json, schema, trx, profilePath);
      json = await handleImages(json, schema, trx, `${profilePath}/users`);
      json = await handleRelationLists(json, schema);

      // Insert user
      await User.create(
        {
          id: user.id,
          fullname: user.fullname,
          email: user.email,
          json,
          password: await bcrypt.hash(user.password, 10),
          _roles: user.roles,
          _groups: user.groups,
        },
        {},
        trx,
      );
    });
    console.log('Users imported');
  }
};
