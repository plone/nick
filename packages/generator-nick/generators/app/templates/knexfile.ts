/**
 * Knexfile
 * @module knexfile
 */

// External imports
import config from '@robgietema/nick/src/helpers/config/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const knexSettings = {
  client: 'pg',
  connection: config.settings.connection,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: [
      path.resolve(__dirname, './src/develop/nick/src/migrations'),
      path.resolve(__dirname, './src/migrations'),
    ],
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.resolve(__dirname, './src/develop/nick/src/seeds'),
  },
};

export default {
  development: knexSettings,
  production: knexSettings,
};
