/**
 * Types routes.
 * @module routes/types/types
 */

// Type imports
import type { Request } from '../../types';
import type { Knex } from 'knex';

// External imports
import { omit } from 'es-toolkit/object';

// Internal imports
import { RequestException } from '../../helpers/error/error';
import { translateSchema } from '../../helpers/schema/schema';
import models from '../../models';

export const handler = async (req: Request, trx: Knex.Transaction) => {
  const Type = models.get('Type');
  const types = await Type.fetchAll({}, {}, trx);
  return {
    json: await types.toJson(req),
  };
};

export default [
  {
    op: 'get',
    view: '/@types',
    permission: 'View',
    client: 'getTypes',
    cache: 'manage',
    handler,
  },
  {
    op: 'get',
    view: '/@types/:type',
    permission: 'View',
    client: 'getType',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Type = models.get('Type');
      const type = await Type.fetchById(req.params.type, {}, trx);
      if (!type) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }
      return {
        json: {
          ...translateSchema(omit(type._schema, ['behaviors']) as any, req),
          layouts: type._schema.layouts || [],
          title: req.i18n(type.title),
        },
      };
    },
  },
];
