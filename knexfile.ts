/**
 * Knexfile
 * @module knexfile
 */

// External imports
import { fileURLToPath } from 'url';
import path from 'path';

// Internal imports
import config from './src/helpers/config/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const knexSettings = {
  client: 'pg',
  connection: config.settings.connection,
  pool: {
    min: 2,
    max: 25,
  },
  migrations: {
    directory: path.resolve(__dirname, './src/migrations'),
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.resolve(__dirname, './src/seeds'),
  },
};

export default {
  development: knexSettings,
  production: knexSettings,
};
