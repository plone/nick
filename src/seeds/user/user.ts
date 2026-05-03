/**
 * User seed.
 * @module seeds/user/user
 */

// Type imports
import type { Knex } from 'knex';

// External imports
// @ts-expect-error bcrypt-promise does not have types
import bcrypt from 'bcrypt-promise';
import { omit } from 'es-toolkit/object';

// Internal imports
import { fileExists } from '../../helpers/fs/fs';
import { stripI18n } from '../../helpers/i18n/i18n';
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
    await Promise.all(
      profile.users.map(async (user: any) => {
        // Insert user
        await User.create(
          {
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            json: omit(user, [
              ...userFields,
              'password',
              'roles',
              'groups',
              'id',
              'fullname',
              'email',
            ]),
            password: await bcrypt.hash(user.password, 10),
            _roles: user.roles,
            _groups: user.groups,
          },
          {},
          trx,
        );
      }),
    );
    console.log('Users imported');
  }
};
