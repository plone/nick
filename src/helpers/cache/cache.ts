/**
 * Cache helper.
 * @module helpers/cache/cache
 */

// Type imports
import type { Response } from 'express';
import type { Request, Route, View } from '../../types';

// External imports
import crypto from 'node:crypto';
import https from 'node:https';

// Internal imports
import config from '../config/config';

/**
 * Apply cache
 * @method applyCache
 * @param {Response} res Response object
 */
export function applyCache(
  req: Request,
  res: Response,
  route: Route,
  view: View,
): View {
  // Add caching
  if (
    config.settings.cache.enabled &&
    ((config.settings.cache.anonymousOnly && req.user.id === 'anonymous') ||
      !config.settings.cache.anonymousOnly)
  ) {
    // Set etag
    if (config.settings.cache.etag) {
      // Calculate etag
      const etag =
        typeof view.etag === 'string'
          ? view.etag
          : view.json || view.html
            ? crypto
                .createHash('md5')
                .update(
                  view.json ? JSON.stringify(view.json) : (view.html as string),
                )
                .digest('hex')
            : null;

      // Check if etag matches
      if (typeof etag === 'string' && checkETag(req, etag)) {
        return {
          status: 304,
        };
      } else if (typeof etag === 'string') {
        res.set({ Etag: etag });
      }
    }

    // Set xkeys
    if (
      config.settings.cache.xkeys &&
      Array.isArray(view.xkeys) &&
      view.xkeys.length > 0
    ) {
      res.set({ Xkey: view.xkeys.join(' ') });
    }

    // Set cache policy header
    const cachePolicy = config.settings.cache.policies[route.cache];
    switch (cachePolicy.method) {
      case 'private':
      case 'public':
        res.set({
          'Cache-Policy': [
            cachePolicy.method,
            ...(typeof cachePolicy.maxAge === 'number'
              ? [`max-age=${cachePolicy.maxAge}`]
              : []),
            ...(typeof cachePolicy.sMaxAge === 'number'
              ? [`s-maxage=${cachePolicy.sMaxAge}`]
              : []),
            'must-revalidate',
          ].join(', '),
        });
        break;
      case 'no-cache':
      default:
        res.set({
          'Cache-Policy': ['no-cache', 'no-store', 'must-revalidate'].join(
            ', ',
          ),
        });
        break;
    }
  }

  // Return view
  return view;
}

/**
 * Check etag
 * @method checkETag
 * @param {Request} req Request object
 * @param {string} etag Etag
 */
export function checkETag(req: Request, etag: string): boolean {
  // Check if etag support enabled
  if (!config.settings.cache.etag) {
    return false;
  }

  // Fetch etag
  const reqETag = req.get('If-None-Match');

  // Check if emtpy
  if (reqETag) {
    // Split and trim etags
    const reqETags = reqETag.split(',').map((tag) => tag.trim());

    // Check if a tag matches or wildcard is specified
    return reqETags.includes('*') || reqETags.includes(etag);
  }
  return false;
}

/**
 * Purge xkey
 * @method purgeXkey
 * @param {string} xkey Xkey to purge
 */
export function purgeXkey(xkey: string): void {
  if (
    config.settings.cache.enabled &&
    config.settings.cache.purge.enabled &&
    Array.isArray(config.settings.cache.purge.urls)
  ) {
    config.settings.cache.purge.urls.map((url) => {
      // Parse url
      const req = new URL(url);

      // Send purge request
      https.request({
        hostname: req.hostname,
        port: req.protocol === 'https:' ? 443 : 80,
        path: req.pathname,
        method: 'PURGE',
        headers: {
          'X-Xkey-Purge': xkey,
        },
      });
    });
  }
}
