/**
 * Client.
 * @module client
 */

// Type imports
import type { Request } from './types';

// External imports
import { NextFunction, Response } from 'express';

// Internal imports
import { RequestException } from './helpers/error/error';
import { initI18n } from './helpers/i18n/i18n';
import { initProfiles } from './helpers/profiles/profiles';
import { callHandler } from './helpers/handler/handler';
import { i18n } from './middleware/i18n/i18n';
import models from './models';
import routes from './routes';

/**
 * Client component
 * @class Client
 */
export class Client {
  /**
   * Initialize.
   * @method initialize
   * @param {Object} Request object.
   * @static
   * @returns {Client} New client object.
   */
  static initialize = ({ token: initToken, apiPath }: any): any => {
    initI18n();
    initProfiles();
    const client = new Client() as any;
    const Document = models.get('Document');

    routes.map((route: any) => {
      if (route.client) {
        client[route.client] = async (
          {
            token,
            path,
            data,
            locktoken,
            query,
            params,
            headers,
            ...rest
          } = {} as any,
        ) => {
          const req = {
            token: initToken || token,
            apiPath,
            documentPath: path || '/',
            body: data,
            query,
            params: {
              ...(params ? params : {}),
              ...rest,
            },
            headers,
          } as Request;
          if (locktoken) {
            req.headers['Lock-Token'] = locktoken;
          }

          await i18n(req, {} as Response, (() => {}) as NextFunction);

          const trx = await Document.startTransaction();

          try {
            const res = await callHandler(req, trx, route, () => {});

            // Try to commit the transaction
            try {
              await trx.commit();
            } catch (_err) {
              throw new RequestException(500, {
                message: req.i18n('Transaction error.'),
              });
            }

            // Call the handler
            return {
              data: res.json,
            };
          } catch (err) {
            // Rollback transaction
            await trx.rollback();
            throw err;
          }
        };
      }
    });

    return client;
  };
}
