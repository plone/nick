/**
 * Server.
 * @module server
 */

// Internal imports
import app from './app';
import config from './helpers/config/config';
import { log } from './helpers/log/log';

// Start server
app.listen(config.settings.port, () =>
  log.info(`Server listening on port ${config.settings.port}`),
);
