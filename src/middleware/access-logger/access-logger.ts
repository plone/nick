/**
 * Access Logger.
 * @module middleware/access-logger/access-logger
 */

// Type imports
import type { Request } from '../../types';

// External imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { NextFunction, Response } from 'express';

// Internal imports
import { logger } from '../../helpers/log/log';

dayjs.extend(utc);

// Create access logger
const access = logger.getLogger('access');

interface ResponseWithLog extends Response {
  _contentLength: number;
}

// Access logger middleware
export function accessLogger(
  req: Request,
  res: ResponseWithLog,
  next: NextFunction,
) {
  function onResFinished() {
    access.info(
      `${req.hostname} - ${(req.user && req.user.id) || 'anonymous'} [${
        req.timestamp
      }] "${req.method} ${req.originalUrl} HTTP/${req.httpVersion}" ${
        res.statusCode
      } ${res._contentLength || '-'} "-" "${req.get('User-Agent')}"`,
    );
  }
  req.timestamp = dayjs.utc().format();
  res.on('finish', onResFinished);
  res.on('error', onResFinished);
  next();
}
