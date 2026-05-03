/**
 * Middleware to work better with Volto.
 * @module middleware/volto/volto
 */

// External imports
import { NextFunction, Request, Response } from 'express';

// Export middleware
export function removeZopeVhosting(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  req.url = req.url.replace(/\/VirtualHostBase.*\/VirtualHostRoot/, '');
  req.url = req.url.replace(/\/\+\+api\+\+/, '');
  next();
}
