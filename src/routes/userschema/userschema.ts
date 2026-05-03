/**
 * User schema route.
 * @module routes/userschema/userschema
 */

// Type imports
import type { Knex } from 'knex';
import type { Request } from '../../types';

// Internal imports
import config from '../../helpers/config/config';
import { mergeSchemas } from '../../helpers/schema/schema';

export default [
  {
    op: 'get',
    view: '/@userschema',
    permission: 'View',
    client: 'getUserSchema',
    cache: 'static',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const schema = {
        fieldsets: [
          {
            id: 'default',
            title: req.i18n('Default'),
            fields: ['fullname', 'email'],
          },
        ],
        properties: {
          fullname: {
            description: req.i18n('Enter full name, for example, John Smith.'),
            title: req.i18n('Full Name'),
            type: 'string',
          },
          email: {
            description: req.i18n(
              'We will use this address if you need to recover your password',
            ),
            title: req.i18n('Email'),
            type: 'string',
            widget: 'email',
          },
        },
        required: ['email'],
      };
      return {
        json:
          config.settings.userschema instanceof Function
            ? mergeSchemas(
                { name: 'default', data: schema },
                { name: 'custom', data: config.settings.userschema(req) },
              )
            : schema,
      };
    },
  },
  {
    op: 'get',
    view: '/@userschema/registration',
    permission: 'View',
    client: 'getRegistrationSchema',
    cache: 'static',
    handler: async (req: Request, trx: Knex.Transaction) => {
      return {
        json: {
          fieldsets: [
            {
              id: 'default',
              title: req.i18n('Default'),
              fields: [
                'fullname',
                'email',
                'username',
                'password',
                'password_ctl',
                'mail_me',
              ],
            },
          ],
          properties: {
            fullname: {
              description: req.i18n(
                'Enter full name, for example, John Smith.',
              ),
              title: req.i18n('Full Name'),
              type: 'string',
            },
            email: {
              description: req.i18n(
                'We will use this address if you need to recover your password',
              ),
              title: req.i18n('Email'),
              type: 'string',
              widget: 'email',
            },
            mail_me: {
              default: false,
              description: '',
              title: req.i18n(
                'Send a confirmation mail with a link to set the password',
              ),
              type: 'boolean',
            },
            password: {
              description: req.i18n('Enter your new password.'),
              title: req.i18n('Password'),
              type: 'string',
              widget: 'password',
            },
            password_ctl: {
              description: req.i18n(
                'Re-enter the password. Make sure the passwords are identical.',
              ),
              title: req.i18n('Confirm password'),
              type: 'string',
              widget: 'password',
            },
            username: {
              description: req.i18n(
                "Enter a user name, usually something like 'jsmith'. No spaces or special characters. Usernames and passwords are case sensitive, make sure the caps lock key is not enabled. This is the name used to log in.",
              ),
              title: req.i18n('Username'),
              type: 'string',
            },
          },
          required: ['email', 'username', 'password', 'password_ctl'],
        },
      };
    },
  },
];
