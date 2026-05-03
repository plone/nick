/**
 * Mail.
 * @module helpers/mail/mail
 */

// Type imports
import type { SendMailOptions } from 'nodemailer';

// External imports
import nodemailer from 'nodemailer';
import { Knex } from 'knex';

// Internal imports
import { log } from '../log/log';
import models from '../../models';

interface MailConfig {
  debug: boolean;
  mailDebug?: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

/**
 * Send mail
 * @method sendMail
 * @param {SendMailOptions} data Mail data to send
 * @param {Object} trx Transaction object.
 */
export async function sendMail(
  data: SendMailOptions,
  trx: Knex.Transaction,
): Promise<void> {
  const Controlpanel = models.get('Controlpanel');
  let transporter: nodemailer.Transporter;

  // Fetch settings
  const controlpanel = (await Controlpanel.fetchById('mail', {}, trx)) as {
    data: MailConfig;
  };
  const config: MailConfig = controlpanel.data;

  // If debug
  if (config.debug) {
    // Set test mailserver
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } else {
    // Set mailserver
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  // Send mail
  const info = await transporter.sendMail(data);

  // Log mail
  log.info(`Mail sent: ${info.messageId}`);

  // If debug
  if (config.mailDebug) {
    log.info(`Mail preview url: ${nodemailer.getTestMessageUrl(info)}`);
  }
}
