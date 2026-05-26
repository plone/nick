/**
 * App.
 * @module app
 */

// Type imports
import type { Request, Route } from './types';

// External imports
import { isObject } from 'es-toolkit/compat';
import express, { NextFunction, Response } from 'express';
import { existsSync, mkdirSync } from 'fs';
import helmet from 'helmet';

// Internal imports
import { applyCache } from './helpers/cache/cache';
import config from './helpers/config/config';
import { RequestException } from './helpers/error/error';
import { callHandler } from './helpers/handler/handler';
import { initI18n } from './helpers/i18n/i18n';
import { log } from './helpers/log/log';
import { initProfiles } from './helpers/profiles/profiles';
import { regExpEscape } from './helpers/utils/utils';
import models from './models';
import globalRoutes from './routes';
import tasks from './tasks';
import middleware from './middleware';

// Init profiles
await initProfiles();

const localRoutes = config.settings.routes
  ? (await import(`${process.cwd()}/src/routes`)).default
  : [];

const routes = [...localRoutes, ...globalRoutes];

// Initialize i18n
initI18n();

// Run scheduled tasks
tasks.run();

// Create blob dir if it doesn’t exist
if (config.settings.blobs === 'file' && !existsSync(config.settings.blobsDir)) {
  mkdirSync(config.settings.blobsDir, { recursive: true });
}

// Check required environment variables
if (process.env.NODE_ENV === 'production') {
  const required = ['SECRET', 'DB_PASSWORD'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n`,
    );
  }

  // Check secret
  if (config.settings.secret === 'secret') {
    throw new Error(
      `Secret can not have the default value in production mode.`,
    );
  }

  // Check cors settings
  if (
    config.settings.cors.allowCredentials === true &&
    config.settings.cors.allowOrigin === '*'
  ) {
    throw new Error(
      'CORS allowOrigin can not be * when allowCredentials is true in production mode.',
    );
  }
}

// Create app
const app = express();

// Add middleware
app.use(
  helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [], // Force HTTPS in production
      },
    },

    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },

    // X-Frame-Options
    frameguard: {
      action: 'deny',
    },

    // X-Content-Type-Options
    noSniff: true,

    // Referrer-Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },

    // X-XSS-Protection (legacy, but still useful)
    xssFilter: true,
  }),
);
app.use(express.json({ limit: config.settings.requestLimit?.api || '1mb' }));

// Use middleware
middleware.use(app);

app.set('trust proxy', config.settings.rateLimit.trustProxy || 1);

// Add routes
routes.map((route: Route) => {
  app[route.op](
    `${regExpEscape(config.settings.prefix)}{*path}${route.view}`,
    route.middleware ||
      ((_req: Request, _res: Response, next: NextFunction) => next()),
    async (req: any, res: Response): Promise<any> => {
      // Start transaction
      const Document = models.get('Document');
      const trx = await Document.startTransaction();
      req.apiPath = `${req.protocol}://${req.headers.host}`;
      if (req.headers.authorization) {
        const match = req.headers.authorization.match(/^Bearer (.*)$/);
        req.token = match ? match[1] : undefined;
      }
      req.documentPath = req.params.path?.join('/') || '/';

      try {
        if (req.body?.stream === true) {
          res.writeHead(200, {
            'Transfer-Encoding': 'chunked',
            'Access-Control-Allow-Origin': config.settings.cors.allowOrigin,
          });
          callHandler(req, trx, route, async (data: any) => {
            res.write(data);
            const result = JSON.parse(data);
            if (result.done) {
              res.end();

              // Try to commit the transaction
              try {
                await trx.commit();
              } catch (_err) {
                throw new RequestException(500, {
                  message: req.i18n('Transaction error.'),
                });
              }
            }
          });
        } else {
          let view = await callHandler(req, trx, route, () => {});

          // Try to commit the transaction
          try {
            await trx.commit();
          } catch (_err) {
            throw new RequestException(500, {
              message: req.i18n('Transaction error.'),
            });
          }

          // Add headers if specified
          if (view && view.headers) {
            res.set(view.headers);
          }

          // Add caching
          view = applyCache(req, res, route, view);

          if (view && view.json) {
            // Send json data
            res.status(view.status || 200).send(view.json);
          } else if (view && view.binary) {
            // Send binary data
            res.statusCode = view.status || 200;
            res.write(view.binary, 'binary');
            res.end(undefined, 'binary');
          } else if (view && view.status) {
            // Send just the status code with no data
            res.status(view.status).send();
          } else if (view && view.html) {
            res.status(view.status || 200).send(view.html);
          }
        }
      } catch (err) {
        // Rollback transaction
        await trx.rollback();

        // Check if request exception
        if (err instanceof RequestException) {
          // Log error
          log.error(
            `${err.status} ${
              isObject(err.message) ? JSON.stringify(err.message) : err.message
            }`,
          );

          // Set location header in redirect
          if (err.status === 301 || err.status === 302) {
            if (typeof err.message === 'string') {
              res.setHeader('Location', err.message);
            }
            return res.status(err.status).send();
          }

          // Return error message
          const message =
            process.env.NODE_ENV === 'production' && err.status >= 500
              ? { message: req.i18n('Internal server error') }
              : err.message;
          return res.status(err.status).send(message);
        } else {
          // Log error
          log.error(err);

          // Return internal server error
          return res
            .status(500)
            .send({ message: req.i18n('Internal server error') });
        }
      }
    },
  );
});

// Export app
export default app;
