/**
 * Permission Model.
 * @module models/permission/permission
 */

// Internal imports
import models from '../';
import { Model } from '../_model/_model';

/**
 * A model for Permission.
 * @class Permission
 * @extends Model
 */
export class Permission extends Model {
  // Set relation mappings
  static get relationMappings() {
    const Role = models.get('Role');
    return {
      _roles: {
        relation: (Model as any).ManyToManyRelation,
        modelClass: Role,
        join: {
          from: 'permission.id',
          through: {
            from: 'role_permission.permission',
            to: 'role_permission.role',
          },
          to: 'role.id',
        },
      },
    };
  }
}
