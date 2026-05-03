/**
 * Push helper.
 * @module helpers/push/push
 */

// Internal imports
import config from '../config/config';

/**
 * Push modifications upstream
 * @method sendPush
 * @param {string} method Method used to be embedded
 * @param {string} path Path of the resource to be pushed
 * @params {data} data Data to be pushed
 * @returns {Promise<void>} Promise that resolves when the push is complete
 */
export async function sendPush(
  method: string,
  path: string,
  data: any,
): Promise<void> {
  // Generate auth header
  const auth = Buffer.from(
    `${config.settings.push.user}:${config.settings.push.password}`,
  ).toString('base64');

  // Send push request
  await fetch(config.settings.push?.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.settings.push?.user && config.settings.push?.password
        ? { Authorization: `Basic ${auth}` }
        : {}),
    },
    body: JSON.stringify({
      method,
      path,
      data,
    }),
  });
}
