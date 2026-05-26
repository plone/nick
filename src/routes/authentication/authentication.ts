/**
 * Authentication routes.
 * @module routes/authentication/authentication
 */

// Type imports
import type { Knex } from 'knex';
import type { Request } from '../../types';

// External imports
// @ts-expect-error bcrypt-promise does not have types
import bcrypt from 'bcrypt-promise';
import jwt from 'jsonwebtoken';

// Internal imports
import events from '../../events';
import { addToken, removeToken } from '../../helpers/auth/auth';
import config from '../../helpers/config/config';
import { RequestException } from '../../helpers/error/error';
import { authLimiter } from '../../helpers/limiter/limiter';
import { log } from '../../helpers/log/log';
import models from '../../models';

/**
 * Generate and store jwt token
 * @method storeToken
 * @param {Object} user User to use for jwt token
 * @returns {string} Generated token
 */
async function storeToken(user: any, trx: Knex.Transaction): Promise<string> {
  // Generate token
  const token = jwt.sign(
    {
      sub: user.id,
      fullname: user.fullname,
    },
    config.settings.secret,
    { expiresIn: '2h', algorithm: 'HS256' },
  );

  // Add token to user
  await addToken(user, token, trx);

  // Return token
  return token;
}

export default [
  {
    op: 'post',
    view: '/@login',
    client: 'login',
    cache: 'alter',
    middleware: authLimiter,
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Controlpanel = models.get('Controlpanel');
      const User = models.get('User');

      if (!req.body.login || !req.body.password) {
        log.error(`Log in attempt without login or password from ${req.ip}.`);
        throw new RequestException(400, {
          error: {
            type: req.i18n('Missing credentials'),
            message: req.i18n('Login and password must be provided in body.'),
          },
        });
      }

      // Fetch settings
      const controlpanel = await Controlpanel.fetchById('mail', {}, trx);
      const settings = controlpanel.data;

      // Find user by id
      const user = settings.use_email_as_login
        ? await User.fetchOne({ email: req.body.login }, {}, trx)
        : await User.fetchById(req.body.login, {}, trx);

      // If user not found
      if (!user) {
        log.error(
          `Log in attempt failed, user '${req.body.login}' not found from ${req.ip}.`,
        );
        throw new RequestException(401, {
          error: {
            type: req.i18n('Invalid credentials'),
            message: req.i18n('Wrong login and/or password.'),
          },
        });
      }

      // Check password
      const same = await bcrypt.compare(req.body.password, user.password);
      if (!same) {
        log.error(
          `Log in attempt failed, password incorrect for user '${req.body.login}' from ${req.ip}.`,
        );
        throw new RequestException(401, {
          error: {
            type: req.i18n('Invalid credentials'),
            message: req.i18n('Wrong login and/or password.'),
          },
        });
      }

      // Log success
      log.info(
        `Log in attempt success for user '${req.body.login}' from ${req.ip}.`,
      );

      // Trigger on login
      await events.trigger('onLogin', req.document, user, trx);

      // Return ok
      return {
        json: {
          token: await storeToken(user, trx),
        },
      };
    },
  },
  {
    op: 'post',
    view: '/@login-renew',
    client: 'renewLogin',
    cache: 'alter',
    middleware: authLimiter,
    handler: async (req: Request, trx: Knex.Transaction) => {
      if (req.user.id === 'anonymous') {
        // Log error
        log.info('Log in renew attempt failed for anonymous user.');

        throw new RequestException(401, {
          error: {
            type: req.i18n('Invalid session'),
            message: req.i18n('User is not logged in.'),
          },
        });
      }

      // Log success
      log.info(`Log in renew attempt success for user '${req.user.id}'.`);

      return {
        json: {
          token: await storeToken(req.user, trx),
        },
      };
    },
  },
  {
    op: 'post',
    view: '/@logout',
    client: 'logout',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      // Trigger on logout
      await events.trigger('onLogout', req.document, req.user, trx);

      // Remove token from user
      if (req.token) {
        await removeToken(req.user, req.token, trx);
      }

      // Log success
      return {
        status: 204,
      };
    },
  },
];
