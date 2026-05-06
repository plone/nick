/**
 * Lock routes.
 * @module routes/lock/lock
 */

// Type imports
import type { Request } from '../../types';
import type { Knex } from 'knex';

// Internal imports
import { RequestException } from '../../helpers/error/error';
import { sendMail } from '../../helpers/mail/mail';
import { stripNewlines } from '../../helpers/utils/utils';
import { apiLimiter } from '../../helpers/limiter/limiter';
import models from '../../models';

export default [
  {
    op: 'post',
    view: '/@email-send',
    permission: 'Modify',
    client: 'sendEmail',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      // Check if required fields provided
      if (!req.body.to || !req.body.from || !req.body.message) {
        throw new RequestException(400, {
          message: req.i18n('To, from and message are required fields.'),
        });
      }

      // Fetch settings
      const Controlpanel = models.get('Controlpanel');
      const controlpanel = await Controlpanel.fetchById('mail', {}, trx);
      const settings = controlpanel.data;
      const siteAddress = `"${stripNewlines(settings.email_from_name)}" <${stripNewlines(settings.email_from_address)}>`;

      // Send mail
      await sendMail(
        {
          to: stripNewlines(req.body.to),
          from: siteAddress,
          replyTo: req.body.name
            ? `"${stripNewlines(req.body.name)}" <${stripNewlines(req.body.from)}>`
            : stripNewlines(req.body.from),
          subject: stripNewlines(req.body.subject || ''),
          text: req.body.message,
        },
        trx,
      );

      return {
        status: 204,
      };
    },
  },
  {
    op: 'post',
    view: '/@users/:id/@email-notification',
    permission: 'Modify',
    client: 'userEmailNotification',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      // Check if required fields provided
      if (!req.body.from || !req.body.message) {
        throw new RequestException(400, {
          message: req.i18n('From and message are required fields.'),
        });
      }

      // Fetch user
      const User = models.get('User');
      const user = await User.fetchById(req.params.id, {}, trx);
      if (!user) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }

      // Fetch settings
      const Controlpanel = models.get('Controlpanel');
      const controlpanel = await Controlpanel.fetchById('mail', {}, trx);
      const settings = controlpanel.data;
      const siteAddress = `"${stripNewlines(settings.email_from_name)}" <${stripNewlines(settings.email_from_address)}>`;

      // Send mail
      await sendMail(
        {
          to: `"${stripNewlines(user.fullname)}" <${stripNewlines(user.email)}>`,
          from: siteAddress,
          replyTo: req.body.name
            ? `"${stripNewlines(req.body.name)}" <${stripNewlines(req.body.from)}>`
            : stripNewlines(req.body.from),
          subject: stripNewlines(req.body.subject || ''),
          text: req.body.message,
        },
        trx,
      );

      return {
        status: 204,
      };
    },
  },
  {
    op: 'post',
    view: '/@email-notification',
    permission: 'View',
    client: 'emailNotification',
    middleware: apiLimiter,
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      // Check if required fields provided
      if (!req.body.from || !req.body.message) {
        throw new RequestException(400, {
          message: req.i18n('From and message are required fields.'),
        });
      }

      // Fetch settings
      const Controlpanel = models.get('Controlpanel');
      const controlpanel = await Controlpanel.fetchById('mail', {}, trx);
      const settings = controlpanel.data;
      const siteAddress = `"${stripNewlines(settings.email_from_name)}" <${stripNewlines(settings.email_from_address)}>`;

      // Send mail
      await sendMail(
        {
          to: siteAddress,
          from: siteAddress,
          replyTo: req.body.name
            ? `"${stripNewlines(req.body.name)}" <${stripNewlines(req.body.from)}>`
            : stripNewlines(req.body.from),
          subject: stripNewlines(req.body.subject || ''),
          text: req.body.message,
        },
        trx,
      );

      return {
        status: 204,
      };
    },
  },
];
