/**
 * multipart/form-data helper.
 *
 * Content POST and PATCH requests accept multipart/form-data as an alternative to a plain
 * JSON body, mirroring plone.restapi. A part named `data` carries the JSON payload, and a
 * file/image field in that JSON references another part by name as `{ part: '<part name>' }`.
 * Only top-level fields are resolved, since that is the only shape plone.restapi supports.
 *
 * @module helpers/multipart/multipart
 */

// Type imports
import type { Request } from '../../types';
import type { NextFunction, Response } from 'express';

// External imports
import express from 'express';
import multer from 'multer';

// Internal imports
import config from '../../helpers/config/config';
import { RequestException } from '../../helpers/error/error';
import { bytesToNumber } from '../../helpers/utils/utils';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: bytesToNumber(config.settings.requestLimit?.files || '10mb'),
  },
}).any();

/**
 * Parse the request body, whether it is JSON or multipart/form-data.
 * @method contentBodyParser
 * @param {Request} req The request object.
 * @param {Response} res The response object.
 * @param {NextFunction} next The next function.
 */
export function contentBodyParser(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.is('multipart/form-data')) {
    express.json({
      limit: config.settings.requestLimit?.files || '10mb',
    })(req, res, next);
    return;
  }

  upload(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      // Nothing further down the chain handles an error raised from route
      // middleware, so answer it directly here, as a regular API error.
      res.status(413).json({
        message: req.i18n ? req.i18n('Upload too large.') : 'Upload too large.',
      });
      return;
    }
    if (err) {
      next(err);
      return;
    }
    next();
  });
}

/**
 * Resolve a multipart/form-data request body into the plain JSON shape the rest of the
 * content handlers already understand, replacing `{ part: '<name>' }` file/image field
 * references with the base64 shape `handleFiles`/`handleImages` expect.
 * @method resolveMultipartBody
 * @param {Request} req The request object.
 * @returns {Record<string, any>} The resolved request body.
 */
export function resolveMultipartBody(req: Request): Record<string, any> {
  if (!req.is('multipart/form-data')) {
    return req.body || {};
  }

  const files = (req.files as Express.Multer.File[] | undefined) || [];
  const dataFile = files.find((file) => file.fieldname === 'data');

  // A multipart request with no `data` part is treated as an empty body, matching
  // plone.restapi. For content POST/PATCH this simply fails the usual required-field
  // checks further down.
  if (!dataFile) return {};

  let body: Record<string, any>;
  try {
    body = JSON.parse(dataFile.buffer.toString('utf-8'));
  } catch {
    throw new RequestException(400, {
      message: req.i18n('No JSON object could be decoded'),
    });
  }

  const partsByName = new Map(
    files
      .filter((file) => file.fieldname !== 'data')
      .map((file) => [file.fieldname, file] as const),
  );

  for (const [key, value] of Object.entries(body)) {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      !('part' in value)
    ) {
      continue;
    }

    const part = partsByName.get((value as { part: string }).part);
    if (!part) {
      throw new RequestException(400, {
        message: req.i18n('Part {part} not found.', {
          part: (value as { part: string }).part,
        }),
      });
    }

    body[key] = {
      data: part.buffer.toString('base64'),
      encoding: 'base64',
      'content-type':
        (value as { 'content-type'?: string })['content-type'] ||
        part.mimetype ||
        'application/octet-stream',
      filename: (value as { filename?: string }).filename || part.originalname,
    };
  }

  return body;
}
