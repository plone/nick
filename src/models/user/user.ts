/**
 * User Model.
 * @module models/user/user
 */

// Type imports
import type { Knex } from 'knex';
import type { Json, Request, VocabularyTerm } from '../../types';

// External imports
import { uniq } from 'es-toolkit/array';

// Internal imports
import models from '../';
import { Model } from '../_model/_model';
import { getRootUrl } from '../../helpers/url/url';

/**
 * A model for User.
 * @class User
 * @extends Model
 */
export class User extends Model {
  // Declare properties
  declare id: string;
  declare fullname: string;
  declare email: string;
  declare json: any;
  declare _roles: any[];
  declare _groups: any[];

  // Set relation mappings
  static get relationMappings(): any {
    const Role = models.get('Role');
    const Group = models.get('Group');
    return {
      _roles: {
        relation: (Model as any).ManyToManyRelation,
        modelClass: Role,
        join: {
          from: 'user.id',
          through: {
            from: 'user_role.user',
            to: 'user_role.role',
          },
          to: 'role.id',
        },
      },
      _groups: {
        relation: (Model as any).ManyToManyRelation,
        modelClass: Group,
        join: {
          from: 'user.id',
          through: {
            from: 'user_group.user',
            to: 'user_group.group',
          },
          to: 'group.id',
        },
      },
      _documentRoles: {
        relation: (Model as any).ManyToManyRelation,
        modelClass: Role,
        join: {
          from: 'user.id',
          through: {
            from: 'user_role_document.user',
            to: 'user_role_document.role',
            extra: ['document'],
          },
          to: 'role.id',
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
    const self: InstanceType<typeof User> = this;
    return {
      '@id': `${getRootUrl(req)}/@users/${self.id}`,
      id: self.id,
      fullname: self.fullname,
      email: self.email,
      roles: self._roles ? self._roles.map((role: any) => role.id) : [],
      groups: self._groups ? self._groups.map((group: any) => group.id) : [],
      ...self.json,
    } as Json;
  }

  /**
   * Get groups of the user.
   * @method getGroups
   * @returns {string[]} Array of groups.
   */
  getGroups(): string[] {
    const self: InstanceType<typeof User> = this;
    return self._groups ? self._groups.map((group: any) => group.id) : [];
  }

  /**
   * Get roles of the user.
   * @method getRoles
   * @returns {string[]} Array of roles.
   */
  getRoles(): string[] {
    const self: InstanceType<typeof User> = this;
    // Add anonymous or authenticated role based on user
    let roles: string[] =
      self.id === 'anonymous' ? ['Anonymous'] : ['Authenticated'];

    // Add roles of the user
    if (self._roles) {
      roles = [...roles, ...self._roles.map((role: any) => role.id)];
    }

    // Add roles of the groups of the users
    if (self._groups) {
      self._groups.map((group: any) => {
        if (group._roles) {
          roles = [...roles, ...group._roles.map((role: any) => role.id)];
        }
      });
    }

    // Return roles
    return roles;
  }

  /**
   * Fetch user roles by document.
   * @method fetchRolesByDocument
   * @param {string} document Uuid of the document
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<string[]>} Array of roles.
   */
  async fetchRolesByDocument(
    document: string,
    trx?: Knex.Transaction,
  ): Promise<string[]> {
    const self: InstanceType<typeof User> = this;
    const rows: any[] = await self.$relatedQuery('_documentRoles', trx).where({
      'user_role_document.document': document,
    });
    return rows.map((role: any) => role.id);
  }

  /**
   * Fetch user and group roles by document.
   * @method fetchUserGroupRolesByDocument
   * @param {string} document Uuid of the document
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<string[]>} Array of roles.
   */
  async fetchUserGroupRolesByDocument(
    document: string,
    trx?: Knex.Transaction,
  ): Promise<string[]> {
    const Group = models.get('Group');
    const roles = await this.fetchRolesByDocument(document, trx);
    const groupRoles = await Group.fetchRolesByDocument(
      this.getGroups(),
      document,
      trx,
    );
    return uniq([...roles, ...groupRoles]);
  }

  /**
   * Returns vocabulary data.
   * @method getVocabularyTerm
   * @param {Request} req Request object.
   * @returns {VocabularyTerm} Vocabulary term.
   */
  getVocabularyTerm(req: Request): VocabularyTerm {
    const self: InstanceType<typeof User> = this;
    return {
      title: req.i18n(self.fullname),
      token: self.id,
    };
  }
}
