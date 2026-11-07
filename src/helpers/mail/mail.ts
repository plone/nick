/**
 * Mail.
 * @module helpers/mail/mail
 */

// Type imports
import type { SendMailOptions, Transporter } from 'nodemailer';

// External imports
import nodemailer from 'nodemailer';
import { Knex } from 'knex';

// Internal imports
import { log } from '../log/log';
import models from '../../models';

interface MailConfig {
  debug: boolean;
  transport?: 'smtp' | 'microsoft365';
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  email_from_address?: string;
  oauth_client_id?: string;
  oauth_tenant_id?: string;
  oauth_client_secret?: string;
}

interface CachedToken {
  token: string;
  expires: number;
}

// Access tokens by tenant, client id and secret, kept until shortly before
// they expire
const tokens: Map<string, CachedToken> = new Map();

/**
 * Get an access token for Microsoft Graph using the client credentials flow
 * @method getAccessToken
 * @param {MailConfig} config Mail settings.
 * @returns {Promise<string>} Access token.
 */
async function getAccessToken(config: MailConfig): Promise<string> {
  const tenant = config.oauth_tenant_id;
  const clientId = config.oauth_client_id;
  const clientSecret = config.oauth_client_secret;

  if (!tenant || !clientId || !clientSecret) {
    throw new Error(
      'Microsoft 365 mail needs the application (client) ID, tenant ID and client secret.',
    );
  }

  // Use the cached token when still valid
  const key = `${tenant}:${clientId}:${clientSecret}`;
  const cached = tokens.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.token;
  }

  const response = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }).toString(),
    },
  );
  const json: any = await response.json().catch(() => ({}));

  if (!response.ok || !json.access_token) {
    throw new Error(
      `Microsoft 365 authentication failed (${response.status}): ${
        json.error_description || json.error || response.statusText
      }`,
    );
  }

  // Keep the token until a minute before it expires
  tokens.set(key, {
    token: json.access_token,
    expires: Date.now() + (Number(json.expires_in) || 3600) * 1000 - 60000,
  });
  return json.access_token;
}

/**
 * Send mail through the Microsoft Graph API
 * @method sendViaGraph
 * @param {SendMailOptions} data Mail data to send
 * @param {MailConfig} config Mail settings.
 * @returns {Promise<string>} Message id.
 */
async function sendViaGraph(
  data: SendMailOptions,
  config: MailConfig,
): Promise<string> {
  if (!config.email_from_address) {
    throw new Error('Microsoft 365 mail needs the site From address.');
  }

  // Build the MIME message, Graph needs the Bcc recipients in the headers
  const composer = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    keepBcc: true,
  } as any);
  const info: any = await composer.sendMail(data);

  const token = await getAccessToken(config);
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.email_from_address)}/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: Buffer.from(info.message).toString('base64'),
    },
  );

  if (!response.ok) {
    // Drop the token, it may have been revoked
    tokens.clear();
    const json: any = await response.json().catch(() => ({}));
    throw new Error(
      `Microsoft 365 could not send the mail (${response.status}): ${
        json.error?.message || response.statusText
      }`,
    );
  }

  return info.messageId;
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
  let transporter: Transporter;

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
  } else if (config.transport === 'microsoft365') {
    // Send using OAuth, no transporter needed
    const messageId = await sendViaGraph(data, config);
    log.info(`Mail sent: ${messageId}`);
    return;
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
  if (config.debug) {
    log.info(`Mail preview url: ${nodemailer.getTestMessageUrl(info)}`);
  }
}
