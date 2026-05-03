/**
 * Role Model.
 * @module models/role/role
 */

// Type imports
import type { Knex } from 'knex';
import type { Json, Request } from '../../types';

// External imports
import { uniq } from 'es-toolkit/array';

// Internal imports
import models from '../';
import { Model } from '../_model/_model';
import { getRootUrl } from '../../helpers/url/url';

/**
 * A model for Role.
 * @class Role
 * @extends Model
 */
export class Role extends Model {
  // Set relation mappings
  static get relationMappings() {
    const Permission = models.get('Permission');
    return {
      _permissions: {
        relation: (Model as any).ManyToManyRelation,
        modelClass: Permission,
        join: {
          from: 'role.id',
          through: {
            from: 'role_permission.role',
            to: 'role_permission.permission',
          },
          to: 'permission.id',
        },
      },
    };
  }

  /**
   * Returns JSON data.
   * @method toJson
   * @param {Request} req Request object.
   * @returns {Json} JSON object.
   */
  toJson(req: Request): Json {
    const self: any = this;
    return {
      '@id': `${getRootUrl(req)}/@roles/${self.id}`,
      '@type': 'role',
      id: self.id,
      title: req.i18n(self.title),
    } as Json;
  }

  /**
   * Fetch permissions.
   * @method fetchPermission
   * @static
   * @param {string[]} roles Array of roles
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<string[]>} Array of permission ids.
   */
  static async fetchPermissions(
    roles: string[],
    trx: Knex.Transaction,
  ): Promise<string[]> {
    const permissions = await this.relatedQuery('_permissions', trx).for(roles);
    return uniq(permissions.map((permission: any) => permission.id));
  }
}
