/**
 * System route.
 * @module routes/system/system
 */

// Type imports
import type { Knex } from 'knex';
import type { Request } from '../../types';

// Internal imports
import { getPostgresVersion } from '../../helpers/knex/knex';
import { getRootUrl } from '../../helpers/url/url';
import { getNodeVersion } from '../../helpers/utils/utils';
import packageJson from '../../../package.json';

export default [
  {
    op: 'get',
    view: '/@system',
    permission: 'Manage Site',
    client: 'getSystem',
    cache: 'static',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const postgresVersion = await getPostgresVersion(trx);

      return {
        json: {
          '@id': `${getRootUrl(req)}/@system`,
          nick_version: packageJson.version,
          node_version: getNodeVersion(),
          express_version: packageJson.dependencies.express,
          objection_version: packageJson.dependencies.objection,
          knex_version: packageJson.dependencies.knex,
          postgres_version: postgresVersion,
        },
      };
    },
  },
];
