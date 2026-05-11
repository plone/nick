/**
 * Form routes.
 * @module routes/form/form
 */

// Type imports
import type { Knex } from 'knex';

// External imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { isObject } from 'es-toolkit/compat';
import { v4 as uuid } from 'uuid';

// Internal imports
import { RequestException } from '../../helpers/error/error';
import { formatTemplate } from '../../helpers/format/format';
import { apiLimiter } from '../../helpers/limiter/limiter';
import { sendMail } from '../../helpers/mail/mail';
import { schemaToHtml } from '../../helpers/schema/schema';
import { getUrl } from '../../helpers/url/url';
import { stripNewlines } from '../../helpers/utils/utils';
import models from '../../models';
import { Request } from '../../types';

type Item = {
  value: string;
  label: string;
};

dayjs.extend(utc);

export default [
  {
    op: 'get',
    view: '/@form-data',
    permission: 'Modify',
    client: 'getFormData',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const block_id =
        typeof req.query.block_id === 'string' ? req.query.block_id : undefined;
      const block = block_id && req.document.json?.blocks?.[block_id];

      // Check if block is defined
      if (!block) {
        throw new RequestException(400, {
          message: req.i18n('Provided block id is not valid.'),
        });
      }

      // Get form data
      const items: Item[] = [];
      let expired_total = 0;
      const Form = models.get('Form');
      const form_data = await Form.fetchAll(
        { block: block_id, document: req.document.uuid },
        {},
        trx,
      );

      // Fetch items
      form_data.map((data: any) => {
        // Check if expired
        if (
          block.data_wipe > 0 &&
          dayjs().diff(data.created, 'day') > block.data_wipe
        ) {
          expired_total = expired_total += 1;
        } else {
          items.push({ ...data.data, created: data.created });
        }
      });

      // Return data
      return {
        json: {
          '@id': `${getUrl(req)}/@form-data`,
          items,
          items_total: items.length,
          expired_total: expired_total,
        },
      };
    },
  },
  {
    op: 'post',
    view: '/@schemaform-data',
    permission: 'View',
    client: 'schemaformData',
    middleware: apiLimiter,
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const block = req.document.json?.blocks?.[req.body?.block_id];

      // Check if block is defined
      if (!block) {
        throw new RequestException(400, {
          message: req.i18n('Provided block id is not valid.'),
        });
      }

      // Check if data is provided
      if (!isObject(req.body.data)) {
        throw new RequestException(400, {
          message: req.i18n('No data is submitted.'),
        });
      }

      // Check if data should be stored
      if (block.store === true) {
        const Form = models.get('Form');

        // Set creation time
        const created = dayjs.utc().format();

        await Form.create(
          {
            uuid: uuid(),
            document: req.document.uuid,
            block: req.body.block_id,
            data: req.body.data,
            created,
            confirm: true,
          },
          {},
          trx,
        );
      }

      // Check if mail(s) should be send
      if (block.send === true || block.send_confirmation) {
        // Fetch settings
        const Controlpanel = models.get('Controlpanel');
        const mail_controlpanel = await Controlpanel.fetchById('mail', {}, trx);
        const mail_settings = mail_controlpanel.data;
        const siteAddress = `"${stripNewlines(mail_settings.email_from_name)}" <${stripNewlines(mail_settings.email_from_address)}>`;
        const fields = schemaToHtml(block.schema, req.body.data);
        const form_controlpanel = await Controlpanel.fetchById('form', {}, trx);
        const mail_template = form_controlpanel.data.mail_template;

        // Check if data should be send
        if (block.send === true) {
          // Send mail
          await sendMail(
            {
              to: block.recipients,
              from: siteAddress,
              ...(block.bcc ? { bcc: block.bcc } : {}),
              replyTo: block.sender
                ? `"${stripNewlines(block.sender_name)}" <${stripNewlines(block.sender)}>`
                : siteAddress,
              subject: stripNewlines(block.subject || ''),
              html: formatTemplate(mail_template, {
                header: block.mail_header?.data || '',
                footer: block.mail_footer?.data || '',
                title: block.subject || '',
                lang: '',
                admin_info: block.admin_info || '',
                fields: fields,
              }),
            },
            trx,
          );
        }

        // Check if confirmation should be send
        if (block.send_confirmation === true) {
          // fixed_attachment = { data, encoding, filename, content-type }

          // Send mail
          await sendMail(
            {
              to: formatTemplate(block.confirmation_recipients, req.body.data),
              from: siteAddress,
              replyTo: block.sender
                ? `"${stripNewlines(block.sender_name)}" <${stripNewlines(block.sender)}>`
                : siteAddress,
              subject: stripNewlines(block.subject || ''),
              ...(block.fixed_attachment
                ? {
                    attachments: [
                      {
                        filename: block.fixed_attachment.filename,
                        content: block.fixed_attachment.data,
                        encoding: 'base64',
                      },
                    ],
                  }
                : {}),
              html: formatTemplate(mail_template, {
                header: block.mail_header?.data || '',
                footer: block.mail_footer?.data || '',
                title: block.subject || '',
                lang: '',
                admin_info: '',
                fields: fields,
              }),
            },
            trx,
          );
        }
      }

      // Send ok
      return {
        status: 204,
      };
    },
  },
];
