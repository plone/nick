/**
 * Knex setup.
 * @module knex
 */

// External imports
import knexPkg, { Knex } from 'knex';

// Internal imports
import config from '../../helpers/config/config';

// Initialize knex with proper types
export const knex = knexPkg({
  client: 'pg',
  connection: config.settings.connection,
});

// Debug
knex.on('query', (query: Knex.QueryBuilder) => {
  // console.log(query);
});

/**
 * Get postgres version
 * @method getPostgresVersion
 * @param {Transaction} trx Transaction object
 * @returns {Promise<string>} Postgres version.
 */
export async function getPostgresVersion(
  trx: Knex.Transaction,
): Promise<string> {
  const postgres = await knex.raw('show server_version').transacting(trx);
  return postgres.rows[0].server_version;
}
