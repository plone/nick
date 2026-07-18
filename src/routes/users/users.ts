/**
 * Users routes.
 * @module routes/users/users
 */

// Type imports
import type { Knex } from 'knex';
import type { Request } from '../../types';

// External imports
// @ts-expect-error bcrypt-promise does not have types
import bcrypt from 'bcrypt-promise';
import { omit } from 'es-toolkit/object';
import jwt from 'jsonwebtoken';

// Internal imports
import config from '../../helpers/config/config';
import events from '../../events';
import { RequestException } from '../../helpers/error/error';
import {
  handleBlocks,
  handleFiles,
  handleImages,
  handleRelationLists,
} from '../../helpers/content/content';
import { apiLimiter } from '../../helpers/limiter/limiter';
import { sendMail } from '../../helpers/mail/mail';
import models from '../../models';

const userFields = ['id', 'fullname', 'email'];

export default [
  {
    op: 'post',
    view: '/@users/:email/reset-password',
    client: 'resetPassword',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const User = models.get('User');

      // Find user
      let user = await User.fetchOne({ email: req.params.email }, {}, trx);
      if (!user) {
        user = await User.fetchOne({ id: req.params.email }, {}, trx);
      }

      // Check min password length
      if (req.body?.new_password && req.body.new_password.length < 8) {
        throw new RequestException(401, {
          message: req.i18n('Password should be at least 8 characters long.'),
        });
      }

      // Check input
      if (req.body?.reset_token && req.body?.new_password && user) {
        // Decode jwt
        const decoded = jwt.verify(
          req.body?.reset_token,
          config.settings.secret,
          { algorithms: ['HS256'] },
        );

        // User found
        if (user && decoded && user.id === decoded.sub) {
          const password = await bcrypt.hash(req.body?.new_password, 10);
          await User.update(
            user.id,
            {
              password,
            },
            trx,
          );
        } else {
          throw new RequestException(401, {
            message: req.i18n('User doesn’t exist or invalid credentials.'),
          });
        }
      } else if (req.body?.old_password && req.body?.new_password && user) {
        const same = await bcrypt.compare(
          req.body?.old_password,
          user.password,
        );
        if (req.user.id === user.id && same) {
          const password = await bcrypt.hash(req.body?.new_password, 10);
          await User.update(
            user.id,
            {
              password,
            },
            trx,
          );
        }
      } else if (user) {
        // Create token
        const token = jwt.sign(
          {
            sub: user.id,
            fullname: user.fullname,
          },
          config.settings.secret,
          { expiresIn: '2h', algorithm: 'HS256' },
        );

        // Fetch settings
        const Controlpanel = models.get('Controlpanel');
        const controlpanel = await Controlpanel.fetchById('mail', {}, trx);
        const settings = controlpanel.data;

        // Send mail
        await sendMail(
          {
            to: `${user.fullname} <${user.email}>`,
            from: `${settings.email_from_name} <${settings.email_from_address}>`,
            subject: req.i18n('Password reset request'),
            text: req.i18n(
              'The following link takes you to a page where you can reset your password: {url} (This link will expire in 2 hours)',
              { url: `${config.settings.frontendUrl}/passwordreset/${token}` },
            ),
          },
          trx,
        );
      }

      // Return success
      return {
        status: 200,
      };
    },
  },
  {
    op: 'get',
    view: '/@users/:id',
    client: 'getUser',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const User = models.get('User');

      // Check permissions
      const manageUsers = req.permissions.includes('Manage Users');
      if (!manageUsers && req.user.id !== req.params.id) {
        throw new RequestException(401, {
          message: req.i18n('You don’t have permissions to view this user.'),
        });
      }

      const user = await User.fetchById(
        req.params.id,
        {
          related: '[_roles, _groups]',
        },
        trx,
      );
      if (!user) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }
      return {
        json: await user.toJson(req),
        xkeys: [req.params.id, 'groups'],
      };
    },
  },
  {
    op: 'get',
    view: '/@users',
    permission: 'Manage Users',
    client: 'getUsers',
    cache: 'manage',
    middleware: apiLimiter,
    handler: async (req: Request, trx: Knex.Transaction) => {
      const User = models.get('User');
      const query =
        typeof req.query.query === 'string' ? req.query.query : undefined;
      if (query && query.length < 2) {
        throw new RequestException(400, {
          error: req.i18n('Query must be at least 2 characters long.'),
        });
      }
      const users = await User.fetchAll(
        query ? { id: ['like', `%${query}%`] } : {},
        { order: 'fullname', related: '[_roles, _groups]' },
        trx,
      );
      return {
        json: await users.toJson(req),
        xkeys: ['users', 'groups'],
      };
    },
  },
  {
    op: 'post',
    view: '/@users',
    client: 'createUser',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const User = models.get('User');

      // Check permissions
      const manageUsers = req.permissions.includes('Manage Users');
      if (!config.settings.userRegistration && !manageUsers) {
        throw new RequestException(401, {
          message: req.i18n('You don’t have permissions to add a user.'),
        });
      }

      // Check min password length
      if (req.body?.password.length < 8) {
        throw new RequestException(401, {
          message: req.i18n('Password should be at least 8 characters long.'),
        });
      }

      // Encrypt password
      const password = req.body.password
        ? await bcrypt.hash(req.body.password, 10)
        : '';

      let json: any = omit(req.body, [
        ...userFields,
        'password',
        'roles',
        'groups',
        'username',
        'fullname',
        'email',
      ]);

      // Handle files, images and relation lists
      const schema = config.settings.userschema(req);
      json = await handleBlocks(json);
      json = await handleFiles(json, schema, trx);
      json = await handleImages(json, schema, trx);
      json = await handleRelationLists(json, schema);

      // Add user
      const user = await User.create(
        {
          id: req.body.username,
          fullname: req.body.fullname,
          email: req.body.email,
          json,
          password: manageUsers ? password : '',
          _roles: manageUsers ? req.body.roles || [] : [],
          _groups: manageUsers ? req.body.groups || [] : [],
        },
        { related: ['_roles', '_groups'] },
        trx,
      );

      // Check if password reset
      if (req.body.sendPasswordReset) {
        // Create token
        const token = jwt.sign(
          {
            sub: user.id,
            fullname: user.fullname,
          },
          config.settings.secret,
          { expiresIn: '2h', algorithm: 'HS256' },
        );

        // Fetch settings
        const Controlpanel = models.get('Controlpanel');
        const controlpanel = await Controlpanel.fetchById('mail', {}, trx);
        const settings = controlpanel.data;

        // Send mail
        await sendMail(
          {
            to: `${user.fullname} <${user.email}>`,
            from: `${settings.email_from_name} <${settings.email_from_address}>`,
            subject: req.i18n('Password reset request'),
            text: req.i18n(
              'The following link takes you to a page where you can reset your password: {url} (This link will expire in 2 hours)',
              { url: `${config.settings.frontendUrl}/password-reset/${token}` },
            ),
          },
          trx,
        );
      }

      // Trigger on after add user
      await events.trigger('onAfterAddUser', req.document, user, trx);

      // Send created
      return {
        status: 201,
        json: await user.toJson(req),
      };
    },
  },
  {
    op: 'patch',
    view: '/@users/:id',
    permission: 'Manage Users',
    client: 'updateUser',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const User = models.get('User');

      // Make a copy
      let json: any = omit(req.body, [
        ...userFields,
        'password',
        'roles',
        'groups',
        'username',
        'fullname',
        'email',
      ]);

      const curUser = await User.fetchById(req.params.id, {}, trx);

      // Handle images
      const schema = config.settings.userschema(req);
      json = await handleBlocks(json);
      json = await handleFiles(json, schema, trx);
      json = await handleImages(json, schema, trx);
      json = await handleRelationLists(json, schema);

      const user = await User.update(
        req.params.id,
        {
          id: req.body.username,
          fullname: req.body.fullname,
          email: req.body.email,
          json: { ...curUser.json, ...json },
          _roles: req.body.roles,
          _groups: req.body.groups,
        },
        trx,
      );

      // Trigger on after update user
      await events.trigger('onAfterUpdateUser', req.document, user, trx);

      // Send ok
      return {
        status: 204,
      };
    },
  },
  {
    op: 'delete',
    view: '/@users/:id',
    permission: 'Manage Users',
    client: 'deleteUser',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const User = models.get('User');
      if (config.settings.systemUsers.includes(req.params.id)) {
        throw new RequestException(401, {
          error: {
            message: req.i18n('You can’t delete system users.'),
            type: req.i18n('System users'),
          },
        });
      }

      // Fetch user
      const user = await User.fetchById(req.params.id, {}, trx);

      // Check if user exists
      if (user) {
        // Trigger on before delete user
        await events.trigger('onBeforeDeleteUser', req.document, user, trx);

        // Delete files and images the user
        await user.deleteFilesAndImages(req, trx);

        // Delete user
        await user.delete(trx);

        // Trigger on after delete user
        await events.trigger('onAfterDeleteUser', req.document, user, trx);
      }

      return {
        status: 204,
      };
    },
  },
];
