/**
 * Document Model.
 * @module models/document/document
 */

// Type imports
import type { Knex } from 'knex';
import type { DeleteInfo, Json, Request } from '../../types';

// External imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  compact,
  drop,
  flatten,
  flattenDeep,
  head,
  last,
  uniq,
} from 'es-toolkit/array';
import { isEmpty, isObject } from 'es-toolkit/compat';
import { mapValues, omit, omitBy, pick, pickBy } from 'es-toolkit/object';
import { isFunction, isUndefined } from 'es-toolkit/predicate';
import { v4 as uuid } from 'uuid';

// Internal imports
import models from '../';
import blocks from '../../blocks';
import behaviors from '../../behaviors';
import { DocumentCollection } from '../../collections/document/document';
import languages from '../../constants/languages';
import events from '../../events';
import { generate, embed } from '../../helpers/ai/ai';
import {
  groupToken,
  principalTokens,
  userToken,
} from '../../helpers/auth/auth';
import config from '../../helpers/config/config';
import { copyFile, removeFile } from '../../helpers/fs/fs';
import { lockExpired } from '../../helpers/lock/lock';
import { getFactoryFields } from '../../helpers/schema/schema';
import { getRootUrl } from '../../helpers/url/url';
import {
  checkGuard,
  evaluateWorkflowExpression,
  toStatusValue,
} from '../../helpers/workflow/workflow';
import {
  isPromise,
  likePrefix,
  mapAsync,
  mapSync,
  sortableTitle,
  uniqueId,
} from '../../helpers/utils/utils';
import { Model } from '../_model/_model';

dayjs.extend(utc);

/**
 * Workflow variables which every history entry has (as Nick fields).
 */
const builtinVariables = [
  'action',
  'actor',
  'comments',
  'time',
  'review_state',
];

/**
 * A model for Document.
 * @class Document
 * @extends Model
 */
export class Document extends Model {
  static tableName: string = 'document';
  static collection: (typeof Model)['collection'] =
    DocumentCollection as unknown as (typeof Model)['collection'];

  static idColumn: string = 'uuid';

  // Declare properties.
  declare uuid: string;
  declare parent: string;
  declare id: string;
  declare path: string;
  declare created: string;
  declare deleted: boolean;
  declare modified: string;
  declare type: string;
  declare position_in_parent: number;
  declare version: number;
  declare owner: string;
  declare json: any;
  declare lock: {
    locked: boolean;
    stealable: boolean;
    created: number;
    timeout: number;
    creator?: string;
    token?: string;
  };
  declare inherit_roles: boolean;
  declare workflow_state: string;
  declare workflow_history: {
    time: string;
    actor: string;
    type?: string;
    action?: string;
    state_title?: string;
    review_state?: string;
    transition_title?: string;
    comments?: string;
  }[];
  declare translation_group: string;
  declare language: string;
  declare _type: any;
  declare _version: any;
  declare _children: Document[];
  declare _parent: Document;
  declare _owner: any;
  declare _restrictedChildren: Document[];
  declare _relationLists: {
    [key: string]: Document[];
  };
  declare _behaviors: boolean;
  declare _cache: any;
  declare _versions: any;
  declare _userRoles: any;
  declare _groupRoles: any;

  // Set relation mappings
  static get relationMappings() {
    const User = models.get('User');
    const Role = models.get('Role');
    const ContentRule = models.get('ContentRule');
    const Catalog = models.get('Catalog');
    const Version = models.get('Version');
    const Type = models.get('Type');

    return {
      _owner: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'document.owner',
          to: 'user.id',
        },
      },
      _parent: {
        relation: Model.BelongsToOneRelation,
        modelClass: Document,
        join: {
          from: 'document.parent',
          to: 'document.uuid',
        },
      },
      _children: {
        relation: Model.HasManyRelation,
        modelClass: Document,
        join: {
          from: 'document.uuid',
          to: 'document.parent',
        },
      },
      _catalog: {
        relation: Model.BelongsToOneRelation,
        modelClass: Catalog,
        join: {
          from: 'document.uuid',
          to: 'catalog.document',
        },
      },
      _versions: {
        relation: Model.HasManyRelation,
        modelClass: Version,
        join: {
          from: 'document.uuid',
          to: 'version.document',
        },
      },
      _type: {
        relation: Model.BelongsToOneRelation,
        modelClass: Type,
        join: {
          from: 'document.type',
          to: 'type.id',
        },
      },
      _userRoles: {
        relation: Model.ManyToManyRelation,
        modelClass: Role,
        join: {
          from: 'document.uuid',
          through: {
            from: 'user_role_document.document',
            to: 'user_role_document.role',
            extra: ['user'],
          },
          to: 'role.id',
        },
      },
      _groupRoles: {
        relation: Model.ManyToManyRelation,
        modelClass: Role,
        join: {
          from: 'document.uuid',
          through: {
            from: 'group_role_document.document',
            to: 'group_role_document.role',
            extra: ['group'],
          },
          to: 'role.id',
        },
      },
      _contentRules: {
        relation: Model.ManyToManyRelation,
        modelClass: ContentRule,
        join: {
          from: 'document.uuid',
          through: {
            from: 'content_rule_document.document',
            to: 'content_rule_document.content_rule',
            extra: ['enabled', 'bubble'],
          },
          to: 'content_rule.id',
        },
      },
    };
  }

  // Modifiers
  static modifiers: any = {
    order(query: any) {
      query.orderBy('position_in_parent');
    },
  };

  /**
   * Lock the document row until the end of the transaction and reload it,
   * so concurrent changes of the document or its children are serialized.
   * @method lockForUpdate
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<void>}
   */
  async lockForUpdate(trx: Knex.Transaction): Promise<void> {
    const self: InstanceType<typeof Document> = this;
    const fresh = await Document.query(trx).findById(self.uuid).forUpdate();
    if (fresh) {
      Object.assign(self, fresh);
    }
  }

  /**
   * Fetch version
   * @method fetchVersion
   * @param {string} document Uuid of the document
   * @param {Knex.Transaction} trx Transaction object.
   */
  async fetchVersion(version: any, trx?: Knex.Transaction): Promise<void> {
    this._version = await this.$relatedQuery('_versions', trx)
      .where({ version })
      .first();
  }

  /**
   * Apply behaviors
   * @param {Knex.Transaction} trx Transaction object.
   * @method applyBehaviors
   */
  async applyBehaviors(trx?: Knex.Transaction): Promise<void> {
    const self: InstanceType<typeof Document> = this;
    // If type not found fetch type
    if (!self._type) {
      await self.fetchRelated('_type', trx);
    }

    // Assign behaviors
    Object.assign(
      self,
      ...Object.values(pick(behaviors.behaviors, self._type.schema.behaviors)),
    );
  }

  /**
   * Set restricted children
   * @method restrictChildren
   * @param {Request} req Request object.
   * @param {Knex.Transaction} trx Transaction object.
   */
  async restrictChildren(req: Request, trx?: Knex.Transaction): Promise<void> {
    const self: InstanceType<typeof Document> = this;
    const Catalog = models.get('Catalog');
    const paths = (self._children || []).map((child: any) => child.path);

    // Nothing to check without children
    if (paths.length === 0) {
      self._restrictedChildren = [];
      return;
    }
    const items = await Catalog.fetchAllRestricted(
      { _path: ['=', paths] },
      {},
      trx,
      req,
    );
    const restrictedPaths = new Set(
      items.map((item: InstanceType<typeof Catalog>) => item._path),
    );
    self._restrictedChildren = (self._children || []).filter((child: any) =>
      restrictedPaths.has(child.path),
    );
  }

  /**
   * Fetch relation lists
   * @method fetchRelationLists
   * @param {Knex.Transaction} trx Transaction object.
   * @param {Request} req Request object, if given only the related documents
   * the current user can view are fetched.
   */
  async fetchRelationLists(
    trx?: Knex.Transaction,
    req?: Request,
  ): Promise<void> {
    const self: InstanceType<typeof Document> = this;
    const Catalog = models.get('Catalog');
    // Check if version data
    const version = self._version ? { ...self._version.json } : {};

    // Get file fields
    const json = {
      ...self.json,
      ...version,
    };

    // Reset lists
    self._relationLists = {};

    // Fetch type
    if (!self._type) {
      await self.fetchRelated('_type', trx);
    }

    // Loop through relation list fields
    const relationListFields = getFactoryFields(
      self._type._schema,
      'Relation List',
    );
    await Promise.all(
      relationListFields.map(async (field: string) => {
        // Check if related documents
        if (Array.isArray(json[field]) && json[field].length > 0) {
          let uuids = json[field];

          // Only keep the documents the user can view
          if (req) {
            const items = await Catalog.fetchAllRestricted(
              { _UID: ['=', uuids] },
              {},
              trx,
              req,
            );
            uuids = items.map((item: any) => item._UID);
          }

          self._relationLists[field] = await Document.fetchAll(
            {
              uuid: ['=', uuids],
            },
            {},
            trx,
          );
        }
      }),
    );
  }

  /**
   * Get url
   * @method getUrl
   * @param {Request} req Request object
   * @returns {string} Url
   */
  getUrl(req: Request): string {
    const self: InstanceType<typeof Document> = this;
    return `${getRootUrl(req)}${self.path === '/' ? '' : self.path}`;
  }

  /**
   * Set id
   * @method setId
   * @param {string} id Provided id (can be empty)
   * @param {Array} blacklist Blacklist ids
   * @returns {string} Id
   */
  setId(id: string | undefined, blacklist: string[]): void {
    this.id = uniqueId(id || '', blacklist);
  }

  /**
   * Check if the document is locked for a request: it is locked, the lock
   * has not expired and the request isn't made by the creator of the lock
   * with the lock token. The token alone is not enough, another user who
   * learned it can't edit around the lock.
   * @method isLockedFor
   * @param {string} userId Id of the current user.
   * @param {any} token Lock token of the request.
   * @returns {boolean} True if the document is locked for the request.
   */
  isLockedFor(userId: string, token: any): boolean {
    return (
      this.isLockedByOther(userId) ||
      (this.lock.locked && !lockExpired(this) && token !== this.lock.token)
    );
  }

  /**
   * Check if the document is locked by another user than the current user.
   * @method isLockedByOther
   * @param {string} userId Id of the current user.
   * @returns {boolean} True if the document is locked by another user.
   */
  isLockedByOther(userId: string): boolean {
    return (
      this.lock.locked && !lockExpired(this) && userId !== this.lock.creator
    );
  }

  /**
   * Get the lock information to show to a user. The token is only shown to
   * users who may edit the document; users who may only view it get the lock
   * without the token.
   * @method lockInfo
   * @param {string[]} permissions Permissions of the user on the document.
   * @returns {Object} Lock information.
   */
  lockInfo(permissions: string[]): any {
    if (!this.lock.locked || lockExpired(this)) {
      return { locked: false, stealable: true };
    }
    return permissions.includes('Modify')
      ? this.lock
      : omit(this.lock, ['token']);
  }

  /**
   * Get the sortable title, see the sortableTitle helper
   * @method sortableTitle
   * @returns {string} Sortable title
   */
  sortableTitle(): string {
    return sortableTitle(this.getTitle());
  }

  /**
   * Get title
   * @method getTitle
   * @returns {string} Title
   */
  getTitle(): string {
    return this.json.title;
  }

  /**
   * Replace old path with new path
   * @method replacePath
   * @static
   * @param {String} oldPath Old path.
   * @param {String} newPath New path.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise} A Promise that resolves when replace is done.
   */
  static async replacePath(
    oldPath: string,
    newPath: string,
    trx: Knex.Transaction,
  ): Promise<void> {
    const Redirect = models.get('Redirect');
    const documents: any = await this.fetchAll(
      {
        path: [
          'raw',
          '(path = ? OR path LIKE ?)',
          [oldPath, likePrefix(`${oldPath}/`)],
        ],
      },
      {},
      trx,
    );
    await Promise.all(
      documents.map(async (document: any) => {
        await Redirect.create(
          {
            document: document.uuid,
            path: document.path,
          },
          {},
          trx,
        );
      }),
    );
    const knex = Document.knex();
    // Replace the path prefix of the documents below the old path
    await knex
      .raw(
        'UPDATE document SET path = ? || substr(path, ?) WHERE path LIKE ?',
        [newPath, oldPath.length + 1, likePrefix(`${oldPath}/`)],
      )
      .transacting(trx);
    await knex
      .raw(
        'UPDATE catalog SET "_path" = ? || substr("_path", ?), path = ? || substr(path, ?) WHERE "_path" LIKE ?',
        [
          newPath,
          oldPath.length + 1,
          newPath,
          oldPath.length + 1,
          likePrefix(`${oldPath}/`),
        ],
      )
      .transacting(trx);
  }

  /**
   * Reorder
   * @method reorder
   * @param {string} id Id of item to order.
   * @param {number|string} delta 'top', 'bottom' or numerical offset.
   * @param {Knex.Transaction} trx Transaction object.
   * @param {string[]} subsetIds Ids of the (visible) subset of the children
   * the delta applies to, in their current order.
   * @returns {Promise} A Promise that resolves when the ordering has been done.
   */
  async reorder(
    id: string,
    delta: any,
    trx?: Knex.Transaction,
    subsetIds?: string[],
  ): Promise<void> {
    const self: InstanceType<typeof Document> = this;
    const children = self._children || [];

    // The items which are ordered and their positions
    const subset = subsetIds
      ? children.filter((child: any) => subsetIds.includes(child.id))
      : [...children];
    const positions = subset.map((child: any) => children.indexOf(child));

    // Ignore unknown items and invalid deltas
    const from = subset.findIndex((child: any) => child.id === id);
    const offset = parseInt(delta, 10);
    if (
      from === -1 ||
      (delta !== 'top' && delta !== 'bottom' && isNaN(offset))
    ) {
      return;
    }

    // Set to based on delta
    let to: number;
    if (delta === 'top') {
      to = 0;
    } else if (delta === 'bottom') {
      to = subset.length - 1;
    } else {
      to = Math.min(Math.max(from + offset, 0), subset.length - 1);
    }

    // Reorder the subset and put it back at the positions of the subset
    subset.splice(to, 0, subset.splice(from, 1)[0]);
    positions.forEach((position: number, index: number) => {
      children[position] = subset[index];
    });
    self._children = children;
    await this.fixOrder(trx);
  }

  /**
   * Sort the children
   * @method sortChildren
   * @param {string} on Field to sort on, like `id`, `sortable_title` or a
   * field of the children.
   * @param {string} order Sort order, `ascending` or `descending`.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise} A Promise that resolves when the sorting has been done.
   */
  async sortChildren(
    on: string,
    order: string,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const self: InstanceType<typeof Document> = this;
    const value = (child: any): any => {
      if (on === 'id' || on === 'getId') {
        return child.id;
      }
      if (on === 'sortable_title' || on === 'title') {
        return child.sortableTitle();
      }
      if (['created', 'modified'].includes(on)) {
        return `${child[on]}`;
      }
      return child.json[on] ?? '';
    };
    self._children = [...(self._children || [])].sort((a: any, b: any) => {
      const [x, y] = [value(a), value(b)];
      const result = x < y ? -1 : x > y ? 1 : 0;
      return order === 'descending' || order === 'reverse' ? -result : result;
    });
    await this.fixOrder(trx);
  }

  /**
   * Fix order
   * @method fixOrder
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise} A Promise that resolves when the ordering has been done.
   */
  async fixOrder(trx?: Knex.Transaction): Promise<any> {
    const self: InstanceType<typeof Document> = this;
    return await Promise.all(
      self._children.map(
        async (child: any, index: number) =>
          await child.update({ position_in_parent: index }, trx),
      ),
    );
  }
  /**
   * Returns Recyclebin JSON data.
   * @method toRecyclebinJson
   * @param {Request} req Request object.
   * @returns {Promise<Json>} JSON object.
   */
  async toRecyclebinJson(req: Request): Promise<Json> {
    const self: InstanceType<typeof Document> = this;
    const deleteInfo: DeleteInfo = self.workflow_history.at(-1) || {
      actor: '',
      time: '',
    };

    return {
      '@id': `${self.getUrl(req)}/@recyclebin/${self.uuid}`,
      '@type': self.type,
      actions: [
        { purge: `${self.getUrl(req)}/@recyclebin/${self.uuid}` },
        { restore: `${self.getUrl(req)}/@recyclebin/${self.uuid}/restore` },
      ],
      deleted_by: deleteInfo.actor,
      deletion_date: deleteInfo.time,
      has_children: self._children ? self._children.length > 0 : false,
      id: self.id,
      language: self.language,
      parent_path: self.path.split('/').slice(0, -1).join('/') || '/',
      path: self.path,
      recycle_id: self.uuid,
      review_state: self.workflow_state,
      title: self.getTitle(),
    };
  }

  /**
   * Returns JSON data.
   * @method toJson
   * @param {Request} req Request object.
   * @returns {Promise<Json>} JSON object.
   */
  async toJson(req: Request, components: any = {}): Promise<Json> {
    const self: InstanceType<typeof Document> = this;
    // Check if version data
    const version = self._version
      ? {
          ...omit(self._version.json, ['changeNote']),
          id: self._version.id,
          modified: self._version.created,
        }
      : {};

    // Apply behaviors not applied
    if (!self._behaviors) {
      await this.applyBehaviors();
      self._behaviors = true;
    }

    // Get file fields
    const json: any = {
      ...self.json,
      title: this.getTitle(),
      ...version,
    };

    // Check if type available
    if (self._type) {
      // Loop through file fields
      const fileFields = getFactoryFields(self._type._schema, 'File');
      mapSync(fileFields, (field: string) => {
        // Set data
        if (json[field]) {
          json[field] = {
            'content-type': json[field]['content-type'],
            download: `${this.getUrl(req)}/@@download/${field}`,
            filename: json[field].filename,
            size: json[field].size,
          };
        }
      });

      // Loop through image fields
      const imageFields = getFactoryFields(self._type._schema, 'Image');
      mapSync(imageFields, (field: string) => {
        // Set data
        if (json[field]) {
          json[field] = {
            'content-type': json[field]['content-type'],
            download: `${this.getUrl(req)}/@@images/${json[field].uuid}.${last(
              json[field].filename.split('.'),
            )}`,
            filename: json[field].filename,
            size: json[field].size,
            width: json[field].width,
            height: json[field].height,
            scales: mapValues(json[field].scales, (scale: any) => ({
              width: scale.width,
              height: scale.height,
              download: `${this.getUrl(req)}/@@images/${scale.uuid}.${last(
                json[field].filename.split('.'),
              )}`,
            })),
          };
        }
      });

      // Loop through relation list fields
      const relationListFields = getFactoryFields(
        self._type._schema,
        'Relation List',
      );
      mapSync(relationListFields, async (field: string) => {
        // Check if related documents
        if (
          Array.isArray(json[field]) &&
          json[field].length > 0 &&
          self._relationLists &&
          self._relationLists[field]
        ) {
          json[field] = self._relationLists[field].map((document: any) => ({
            '@id': document.path,
            UID: document.uuid,
            title: document.json.title,
            description: document.json.description,
            review_state: document.workflow_state,
          }));
        }
      });
    }

    // Add children if available
    if (self._children) {
      json.items = await Promise.all(
        (self._restrictedChildren || self._children).map(
          async (child: any) => await child.toJson(req),
        ),
      );
    }

    // Return data
    return {
      ...json,
      ...(isEmpty(components) ? {} : { '@components': components }),
      '@id': self.getUrl(req),
      '@type': self.type,
      id: self.id,
      created: self.created,
      modified: self.modified,
      UID: self.uuid,
      owner: self.owner,
      layout: 'view',
      is_folderish: self._type
        ? self._type._schema.behaviors.includes('folderish')
        : true,
      ...(self.language
        ? {
            language: {
              token: self.language,
              title: languages[self.language as keyof typeof languages],
            },
          }
        : {}),
      review_state: self.workflow_state,
      // The token is only shown to users who may edit the document
      lock: self.lockInfo(
        req.document?.uuid === self.uuid ? req.permissions || [] : [],
      ),
    } as Json;
  }

  /**
   * Traverse path.
   *
   * The documents along the path, their local roles and their types are
   * fetched with a constant number of queries, independent of the depth.
   * @method traverse
   * @param {Array} slugs Array of slugs.
   * @param {Object} user Current user object.
   * @param {Array} roles Array of roles, fetched for this document if
   * undefined.
   * @param {Object} navroot Navigation root.
   * @param {Object} trx Transaction object.
   * @param {Array} documents Documents along the path, fetched if undefined.
   * @returns {Promise<Object>} A Promise that resolves to an object.
   */
  async traverse(
    slugs: string[],
    user: any,
    roles: string[] | undefined,
    navroot: any,
    trx?: Knex.Transaction,
    documents?: any[],
  ): Promise<any> {
    const self: InstanceType<typeof Document> = this;
    const Type = models.get('Type');

    // Fetch the documents with the paths along the slugs, unless given
    const paths = Document.getTraversalPaths(self.path, slugs);
    const candidates: any[] =
      documents ||
      (paths.length > 0
        ? await Document.query(trx).whereIn('path', paths)
        : []);

    // Walk down the slugs by parent and id
    const chain: any[] = [];
    let current: any = self;
    for (const slug of slugs) {
      const child =
        candidates.find(
          (candidate: any) =>
            candidate.parent === current.uuid && candidate.id === slug,
        ) ||
        // Fall back to the parent and id if the path doesn't match
        (await Document.fetchOne({ parent: current.uuid, id: slug }, {}, trx));

      // Check if child not found
      if (!child) {
        return false;
      }
      chain.push(child);
      current = child;
    }

    // Fetch the local roles of the user and the types of all documents
    const localRoles = await user.fetchUserGroupRolesByDocuments(
      [...(roles ? [] : [self.uuid]), ...chain.map((child) => child.uuid)],
      trx,
    );
    const typeIds = uniq(chain.map((child) => child.type));
    const types: any[] =
      typeIds.length > 0
        ? await Type.query(trx)
            .withGraphJoined('_workflow')
            .whereIn('type.id', typeIds)
        : [];

    // Merge the roles and find the navigation root top down
    let mergedRoles: string[] = roles || localRoles[self.uuid];
    chain.forEach((child: any) => {
      child._type = types.find((type: any) => type.id === child.type);
      mergedRoles = child.inherit_roles
        ? uniq([...mergedRoles, ...localRoles[child.uuid]])
        : localRoles[child.uuid];
      if (child._type?._schema.behaviors.includes('navigation_root')) {
        navroot = child;
      }
    });

    // Add owner to roles if current document owned by user
    const document = chain.length > 0 ? chain[chain.length - 1] : self;
    return {
      document,
      localRoles: uniq([
        ...mergedRoles,
        ...(user.id === document.owner ? ['Owner'] : []),
      ]),
      navroot,
    };
  }

  /**
   * Get the paths of the documents along the slugs below a path.
   * @method getTraversalPaths
   * @static
   * @param {string} path Path to start from.
   * @param {Array} slugs Array of slugs.
   * @returns {string[]} Paths.
   */
  static getTraversalPaths(path: string, slugs: string[]): string[] {
    const base = path === '/' ? '' : path;
    return slugs.map(
      (_slug: string, index: number) =>
        `${base}/${slugs.slice(0, index + 1).join('/')}`,
    );
  }

  /**
   * Traverse path from the root, fetching the root together with the
   * documents along the path.
   * @method traverseFromRoot
   * @static
   * @param {Array} slugs Array of slugs.
   * @param {Object} user Current user object.
   * @param {Object} trx Transaction object.
   * @returns {Promise<Object>} Traversal result, false if not found.
   */
  static async traverseFromRoot(
    slugs: string[],
    user: any,
    trx?: Knex.Transaction,
  ): Promise<any> {
    const documents: any[] = await Document.query(trx)
      .whereNull('parent')
      .orWhereIn('path', Document.getTraversalPaths('/', slugs));
    const root = documents.find((document: any) => document.parent === null);
    return root.traverse(
      slugs,
      user,
      undefined,
      root,
      trx,
      documents.filter((document: any) => document !== root),
    );
  }

  /**
   * Fetch workflow history
   * @method fetchWorkflowHistory
   * @param {Request} req Request object
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<any[]>} Array of workflow history.
   */
  async fetchWorkflowHistory(
    req: Request,
    trx?: Knex.Transaction,
  ): Promise<any[]> {
    const self: InstanceType<typeof Document> = this;
    const User = models.get('User');

    // The entry of the creation has no action, it is shown as "Create"
    // like in plone.restapi
    const history: any[] = self.workflow_history;

    return await Promise.all(
      history.map(async (item: any) => {
        const user = item.actor
          ? await User.fetchById(item.actor, {}, trx)
          : undefined;
        return {
          ...item,
          ...(!item.action && (!item.type || item.type === 'workflow')
            ? {
                action: 'Create',
                transition_title: 'Create',
              }
            : {}),
          ...(item.state_title
            ? { state_title: req.i18n(item.state_title) }
            : {}),
          actor: {
            '@id': `${getRootUrl(req)}/@users/${item.actor}`,
            fullname: user ? user.fullname : item.actor,
            id: item.actor,
            username: item.actor,
          },
          comments: item.comments || '',
          type: item.type || 'workflow',
        };
      }),
    );
  }

  /**
   * Fetch the roles of a user on this document: global, local (including
   * the inherited ones) and Owner, the same way as they are calculated when
   * traversing to the document in a request.
   * @method fetchUserRoles
   * @param {Object} user User object with roles and groups.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<string[]>} Array of roles, empty if the document can't
   * be reached.
   */
  async fetchUserRoles(user: any, trx?: Knex.Transaction): Promise<string[]> {
    const self: InstanceType<typeof Document> = this;

    // Get the local roles by traversing from the root
    const result = await Document.traverseFromRoot(
      compact(self.path.split('/')),
      user,
      trx,
    );
    if (!result) {
      return [];
    }
    return uniq([...result.localRoles, ...user.getRoles()]);
  }

  /**
   * Fetch the permissions of a user on this document, the same way as they
   * are calculated when traversing to the document in a request.
   * @method fetchUserPermissions
   * @param {Object} user User object with roles and groups.
   * @param {Knex.Transaction} trx Transaction object.
   * @param {string[]} roles Roles of the user on the document, fetched if
   * omitted.
   * @returns {Promise<string[]>} Array of permissions.
   */
  async fetchUserPermissions(
    user: any,
    trx?: Knex.Transaction,
    roles?: string[],
  ): Promise<string[]> {
    const self: InstanceType<typeof Document> = this;
    const Role = models.get('Role');

    // Deleted documents can't be accessed
    if (self.deleted) {
      return [];
    }

    // Get global, local and owner roles
    const userRoles = roles || (await self.fetchUserRoles(user, trx));
    if (userRoles.length === 0) {
      return [];
    }

    // Fetch type and workflow
    if (!self._type) {
      await self.fetchRelated('_type', trx);
    }
    if (!self._type._workflow) {
      await self._type.fetchRelated('_workflow', trx);
    }

    // Return the global and workflow permissions, by the permission model
    // of the workflows like the request handler
    return await self.applyWorkflowPermissions(
      userRoles,
      await Role.fetchPermissions(userRoles, trx),
      trx,
    );
  }

  /**
   * Fetch the workflow status of this document for a workflow: the state
   * and the variables.
   * @method fetchWorkflowStatus
   * @param {string} workflow Id of the workflow.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<Object | undefined>} Status, undefined if not stored.
   */
  async fetchWorkflowStatus(
    workflow: string,
    trx?: Knex.Transaction,
  ): Promise<{ state: string; variables: Record<string, any> } | undefined> {
    const self: InstanceType<typeof Document> = this;
    return await (trx || Document.knex())('document_workflow_status')
      .select('state', 'variables')
      .where({ document: self.uuid, workflow })
      .first();
  }

  /**
   * Fetch the workflow chain of this document with the state of every
   * workflow: the first workflow has the review state, the others the
   * state of their workflow status (their initial state if none is stored).
   * @method fetchWorkflowChain
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<Object[]>} Workflows with their state.
   */
  async fetchWorkflowChain(
    trx?: Knex.Transaction,
  ): Promise<{ workflow: any; state: string }[]> {
    const self: InstanceType<typeof Document> = this;
    if (!self._type) {
      await self.fetchRelated('_type', trx);
    }
    const [primary, ...others] = await self._type.fetchChain(trx);
    const states: Record<string, string> =
      others.length > 0
        ? Object.fromEntries(
            (
              await (trx || Document.knex())('document_workflow_status')
                .select('workflow', 'state')
                .where({ document: self.uuid })
            ).map((row: any) => [row.workflow, row.state]),
          )
        : {};
    return [
      { workflow: primary, state: self.workflow_state },
      ...others.map((workflow: any) => ({
        workflow,
        state: states[workflow.id] || workflow.json.initial_state,
      })),
    ];
  }

  /**
   * Apply the permissions of the workflows of this document to the global
   * permissions of the roles of a user.
   * @method applyWorkflowPermissions
   * @param {string[]} roles Roles of the user on the document.
   * @param {string[]} globalPermissions Permissions of the roles globally.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<string[]>} Array of permissions.
   */
  async applyWorkflowPermissions(
    roles: string[],
    globalPermissions: string[],
    trx?: Knex.Transaction,
  ): Promise<string[]> {
    const self: InstanceType<typeof Document> = this;
    const Workflow = models.get('Workflow');
    if (!self._type) {
      await self.fetchRelated('_type', trx);
    }
    if ((await self._type.fetchChain(trx)).length === 1) {
      return self._type._workflow.applyPermissions(
        self.workflow_state,
        roles,
        globalPermissions,
      );
    }
    return Workflow.applyChainPermissions(
      await self.fetchWorkflowChain(trx),
      roles,
      globalPermissions,
    );
  }

  /**
   * Store the workflow status of this document for a workflow.
   * @method saveWorkflowStatus
   * @param {string} workflow Id of the workflow.
   * @param {string} state State.
   * @param {Object} variables Variables.
   * @param {Knex.Transaction} trx Transaction object.
   */
  async saveWorkflowStatus(
    workflow: string,
    state: string,
    variables: Record<string, any>,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const self: InstanceType<typeof Document> = this;
    await (trx || Document.knex())('document_workflow_status')
      .insert({
        document: self.uuid,
        workflow,
        state,
        variables: JSON.stringify(variables),
      })
      .onConflict(['document', 'workflow'])
      .merge();
  }

  /**
   * Set the initial workflow status of a new document: the further
   * workflows of the chain start in their initial state, and when the
   * workflow has variables they are computed and stored with the creation
   * entry of the history.
   * @method initWorkflowStatus
   * @param {Object} actor Actor object.
   * @param {Knex.Transaction} trx Transaction object.
   * @param {Request} req Request object.
   */
  async initWorkflowStatus(
    actor: any,
    trx: Knex.Transaction,
    req?: Request,
  ): Promise<void> {
    const self: InstanceType<typeof Document> = this;
    if (!self._type) {
      await self.fetchRelated('_type', trx);
    }
    if (!self._type._workflow) {
      await self._type.fetchRelated('_workflow', trx);
    }
    const [workflow, ...others] = await self._type.fetchChain(trx);
    const compute = async (item: any, state: string) =>
      await item.computeStatus({
        document: self,
        user: actor,
        trx,
        req,
        newState: state,
        kwargs: {},
        date: self.created,
      });

    // The further workflows of the chain start in their initial state
    await mapAsync(others, async (item: any) =>
      self.saveWorkflowStatus(
        item.id,
        item.json.initial_state,
        item.json.variables ? await compute(item, item.json.initial_state) : {},
        trx,
      ),
    );
    if (!workflow.json.variables) {
      return;
    }
    const status = await compute(workflow, self.workflow_state);
    const history = self.workflow_history.map((item: any, index: number) =>
      index === 0 ? { ...item, ...omit(status, builtinVariables) } : item,
    );
    await self.updateAndFetch(
      { workflow_history: JSON.stringify(history) },
      trx,
    );
    await self.saveWorkflowStatus(
      workflow.id,
      self.workflow_state,
      status,
      trx,
    );
  }

  /**
   * Restore the workflow status of an imported document: the given status
   * by workflow, else, when the workflow has variables, the variables of
   * the last entry of the history.
   * @method restoreWorkflowStatus
   * @param {Knex.Transaction} trx Transaction object.
   * @param {Object} status Status by workflow id (state and variables).
   */
  async restoreWorkflowStatus(
    trx: Knex.Transaction,
    status?: Record<string, { state: string; variables?: any }>,
  ): Promise<void> {
    const self: InstanceType<typeof Document> = this;
    if (status) {
      await mapAsync(Object.keys(status), (workflow: string) =>
        self.saveWorkflowStatus(
          workflow,
          status[workflow].state,
          status[workflow].variables || {},
          trx,
        ),
      );
      return;
    }
    if (!self._type) {
      await self.fetchRelated('_type', trx);
    }
    if (!self._type?._workflow) {
      await self._type?.fetchRelated('_workflow', trx);
    }
    const workflow = self._type?._workflow;
    if (!workflow?.json.variables) {
      return;
    }
    const last: Record<string, any> =
      (self.workflow_history || [])
        .filter((item: any) => !item.type || item.type === 'workflow')
        .at(-1) || {};
    const ids = Object.keys(workflow.json.variables).filter(
      (id) => workflow.json.variables[id].for_status,
    );
    await self.saveWorkflowStatus(
      workflow.id,
      self.workflow_state,
      pick(last, ids),
      trx,
    );
  }

  /**
   * Get a workflow variable of this document, like `getInfoFor` of the
   * Plone workflow tool: the state (`review_state`), the history
   * (`review_history`) and the variables of the workflow. A variable with
   * an `info_guard` the user doesn't pass is not available.
   * @method getWorkflowInfo
   * @param {string} name Name of the variable.
   * @param {Knex.Transaction} trx Transaction object.
   * @param {Object} user User object, for the info guard.
   * @returns {Promise<any>} Value, undefined if not available.
   */
  async getWorkflowInfo(
    name: string,
    trx: Knex.Transaction,
    user?: any,
  ): Promise<any> {
    const self: InstanceType<typeof Document> = this;
    if (name === 'review_state') {
      return self.workflow_state;
    }
    if (!self._type) {
      await self.fetchRelated('_type', trx);
    }
    if (!self._type._workflow) {
      await self._type.fetchRelated('_workflow', trx);
    }
    const workflow = self._type._workflow;
    const variable = workflow.json.variables?.[name];
    if (
      variable?.info_guard &&
      user &&
      !(await checkGuard(variable.info_guard, {
        document: self,
        user,
        trx,
        workflow,
      }))
    ) {
      return undefined;
    }
    if (name === 'review_history') {
      return (self.workflow_history || []).filter(
        (item: any) => !item.type || item.type === 'workflow',
      );
    }
    if (!variable) {
      return undefined;
    }
    const status = await self.fetchWorkflowStatus(workflow.id, trx);
    if (status && Object.hasOwn(status.variables, name)) {
      return status.variables[name];
    }
    if (variable.default_expr) {
      return toStatusValue(
        await evaluateWorkflowExpression(variable.default_expr, {
          document: self,
          user: user || { id: 'anonymous', getRoles: () => ['Anonymous'] },
          trx,
          workflow,
          status: status?.variables || {},
        }),
      );
    }
    return variable.default_value ?? null;
  }

  /**
   * Find the workflow of the chain which provides a transition, like
   * `doActionFor` of the Plone workflow tool: the first workflow where the
   * transition can be applied. Otherwise the best answer of the workflows:
   * `same` when the document already is in the new state, `unauthorized`
   * when the guard doesn't pass, `unavailable` in the current state or
   * `unknown`.
   * @method findTransition
   * @param {string} transition Transition to check.
   * @param {Object} actor Actor object.
   * @param {Knex.Transaction} trx Transaction object.
   * @param {string[]} permissions Permissions of the actor, fetched if omitted.
   * @param {Request} req Request object, for guard expressions.
   * @param {string[]} roles Roles of the actor, fetched if omitted.
   * @returns {Promise<Object>} Check, the workflow and its state.
   */
  async findTransition(
    transition: string,
    actor: any,
    trx: Knex.Transaction,
    permissions?: string[],
    req?: Request,
    roles?: string[],
  ): Promise<{
    check: 'apply' | 'same' | 'unknown' | 'unavailable' | 'unauthorized';
    workflow?: any;
    state?: string;
  }> {
    const self: InstanceType<typeof Document> = this;
    const order = ['apply', 'same', 'unauthorized', 'unavailable', 'unknown'];
    let best: any = { check: 'unknown' };
    for (const { workflow, state } of await self.fetchWorkflowChain(trx)) {
      const definition = Object.hasOwn(
        workflow.json.transitions || {},
        transition,
      )
        ? workflow.json.transitions[transition]
        : undefined;
      let check: string;
      if (!definition) {
        check = 'unknown';
      } else if (definition.new_state === state) {
        check = 'same';
      } else if (
        definition.trigger === 'automatic' ||
        !(workflow.json.states?.[state]?.transitions || []).includes(transition)
      ) {
        check = 'unavailable';
      } else if (
        !(await workflow.checkTransitionGuard(transition, {
          document: self,
          user: actor,
          trx,
          req,
          roles,
          permissions,
        }))
      ) {
        check = 'unauthorized';
      } else {
        return { check: 'apply', workflow, state };
      }
      if (order.indexOf(check) < order.indexOf(best.check)) {
        best = { check, workflow, state };
      }
    }
    return best;
  }

  /**
   * Check if a transition can be applied to this document
   * @method checkTransition
   * @param {string} transition Transition to check.
   * @param {Object} actor Actor object.
   * @param {Knex.Transaction} trx Transaction object.
   * @param {string[]} permissions Permissions of the actor, fetched if omitted.
   * @param {Request} req Request object, for guard expressions.
   * @param {string[]} roles Roles of the actor, fetched if omitted.
   * @returns {Promise<string>} `apply`, `same` when the document already is in
   * the new state, `unknown`, `unavailable` in the current state or
   * `unauthorized`.
   */
  async checkTransition(
    transition: string,
    actor: any,
    trx: Knex.Transaction,
    permissions?: string[],
    req?: Request,
    roles?: string[],
  ): Promise<'apply' | 'same' | 'unknown' | 'unavailable' | 'unauthorized'> {
    const self: InstanceType<typeof Document> = this;
    return (
      await self.findTransition(transition, actor, trx, permissions, req, roles)
    ).check;
  }

  /**
   * Change worksflow
   * @method changeWorkflow
   * @param {string} transition Transition to change to.
   * @param {Object} actor Actor object.
   * @param {string} modified Modified timestamp.
   * @param {boolean} recursive
   * @param {Knex.Transaction} trx Transaction object.
   * @param {Request} req Request object.
   * @param {Object} options Comment and publication dates (`effective` and
   * `expires`) of the transition.
   */
  async changeWorkflow(
    transition: string,
    actor: any,
    modified: string,
    recursive: boolean,
    trx: Knex.Transaction,
    req: Request,
    options: { comment?: string; effective?: string; expires?: string } = {},
  ): Promise<void> {
    const self: InstanceType<typeof Document> = this;

    // Fetch type and workflow
    if (!self._type) {
      await self.fetchRelated('_type', trx);
    }
    if (!self._type._workflow) {
      await self._type.fetchRelated('_workflow', trx);
    }

    // Get the workflow of the chain with the transition (the first where
    // it leaves the current state), the review state is the state of the
    // first workflow
    const chain = await self.fetchWorkflowChain(trx);
    const current =
      chain.find(({ workflow, state }) =>
        (workflow.json.states?.[state]?.transitions || []).includes(transition),
      ) ||
      chain.find(({ workflow }) =>
        Object.hasOwn(workflow.json.transitions || {}, transition),
      ) ||
      chain[0];
    const workflow = current.workflow;
    const primary = workflow.id === chain[0].workflow.id;

    // Get prev state, a transition with an empty new state stays
    const old_state = current.state;
    const definition = workflow.json.transitions?.[transition];
    const stay = definition !== undefined && !definition.new_state;
    const new_state = stay ? old_state : definition?.new_state;

    // Set the publication dates; the effective date is set when the item
    // is published (viewable by anonymous) the first time
    const dates = pick(options, ['effective', 'expires']);
    if (
      primary &&
      new_state &&
      new_state !== old_state &&
      !self.json.effective &&
      !dates.effective &&
      workflow.getPermissions(new_state, ['Anonymous']).includes('View')
    ) {
      dates.effective = modified;
    }
    if (Object.keys(dates).length > 0) {
      await self.updateAndFetch({ json: { ...self.json, ...dates } }, trx);
      if (!new_state || new_state === old_state) {
        await self.reindex(trx);
      }
    }

    // Check if state is available and not the current state
    if (new_state && (new_state !== old_state || stay)) {
      // Compute the variables of the workflow
      const status = workflow.json.variables
        ? await workflow.computeStatus({
            document: self,
            user: actor,
            trx,
            req,
            transition,
            oldState: old_state,
            newState: new_state,
            status: (await self.fetchWorkflowStatus(workflow.id, trx))
              ?.variables,
            kwargs: { comment: options.comment || '', ...dates },
            date: modified,
          })
        : undefined;

      // Add to workflow history
      const workflow_history = self.workflow_history;
      workflow_history.push({
        time: modified,
        actor: actor.id,
        action: transition,
        state_title: workflow.json.states[new_state].title,
        review_state: new_state,
        transition_title: workflow.json.transitions[transition].title,
        ...(options.comment ? { comments: options.comment } : {}),
        ...(status ? omit(status, builtinVariables) : {}),
        // Entries of further workflows name their workflow
        ...(primary ? {} : { workflow: workflow.id }),
      });
      if (status || !primary) {
        await self.saveWorkflowStatus(
          workflow.id,
          new_state,
          status || {},
          trx,
        );
      }

      // Trigger on before change workflow
      await events.trigger(
        'onBeforeChangeWorkflow',
        self,
        actor,
        trx,
        transition,
        new_state,
      );

      // Update document, the review state is the state of the first workflow
      await self.updateAndFetch(
        {
          modified: modified,
          ...(primary ? { workflow_state: new_state } : {}),
          workflow_history: JSON.stringify(workflow_history),
        },
        trx,
      );

      // Reindex document
      await self.reindex(trx);

      // Trigger on after change workflow
      await events.trigger(
        'onAfterChangeWorkflow',
        self,
        actor,
        trx,
        req,
        transition,
        old_state,
      );
    }

    // Done when not recursive
    if (!recursive) {
      return;
    }

    // If children not found fetch children
    if (!self._children) {
      await self.fetchChildren({}, trx, false);
    }

    // Change workflow of children
    await mapAsync(
      self._children,
      async (child: any) =>
        await child.changeWorkflow(
          transition,
          actor,
          modified,
          recursive,
          trx,
          req,
          options,
        ),
    );
  }

  /**
   * Copy object
   * @method copy
   * @param {string} parent Parent to copy to.
   * @param {string} path New path.
   * @param {string} id New id.
   * @param {Knex.Transaction} trx Transaction object.
   * @param {string[]} created Uuids of the copies created by this copy, they
   * are never copied again (when copying into a descendant of itself).
   */
  async copy(
    parent: string,
    path: string,
    id: string,
    trx?: Knex.Transaction,
    created: string[] = [],
  ): Promise<any> {
    const self: InstanceType<typeof Document> = this;
    // Get json
    let json: any = self.json;

    // Get the children before the copy is created, it can be one of them
    await self.fetchChildren({}, trx, false);
    const children = self._children.filter(
      (child: any) => !created.includes(child.uuid),
    );

    // Get type information
    await self.fetchRelated('_type', trx);

    // Store used uuids
    const fileUuid: Record<string, string> = {};
    const fileFields = getFactoryFields(self._type._schema, 'File');
    const imageFields = getFactoryFields(self._type._schema, 'Image');

    // Copy files
    const copyFiles = async () =>
      await mapAsync(fileFields, async (field: string) => {
        if (json[field].uuid in fileUuid) {
          json[field].uuid = fileUuid[json[field].uuid];
        } else {
          const newUuid = uuid();
          await copyFile(json[field].uuid, newUuid, trx);
          fileUuid[json[field].uuid] = newUuid;
          json[field].uuid = newUuid;
        }
      });
    await copyFiles();

    // Copy images
    const copyImages = async () =>
      await mapAsync(imageFields, async (field: string) => {
        if (json[field].uuid in fileUuid) {
          json[field].uuid = fileUuid[json[field].uuid];
        } else {
          const newUuid = uuid();
          await copyFile(json[field].uuid, newUuid, trx);
          fileUuid[json[field].uuid] = newUuid;
          json[field].uuid = newUuid;
        }
        await mapAsync(
          Object.keys(config.settings.imageScales),
          async (scale) => {
            if (json[field].scales[scale].uuid in fileUuid) {
              json[field].scales[scale].uuid =
                fileUuid[json[field].scales[scale].uuid];
            } else {
              const newScaleUuid = uuid();
              copyFile(self.json[field].scales[scale].uuid, newScaleUuid, trx);
              fileUuid[json[field].scales[scale].uuid] = newScaleUuid;
              json[field].scales[scale].uuid = newScaleUuid;
            }
          },
        );
      });
    await copyImages();

    // Copy document
    const document = await Document.create(
      {
        ...omit(self, [
          '_type',
          '_behaviors',
          '_cache',
          '_versions',
          '_userRoles',
          '_groupRoles',
          '_children',
        ]),
        json,
        parent,
        path,
        id,
        uuid: uuid(),
        workflow_history: JSON.stringify(self.workflow_history),
        // The lock belongs to the original
        lock: { locked: false, stealable: true },
      },
      {},
      trx,
    );
    created.push(document.uuid);

    // Copy versions
    await self.fetchRelated('_versions', trx);
    await Promise.all(
      self._versions.map(async (version: any) => {
        // Get current json
        json = version.json;

        // Copy images/files
        await copyFiles();
        await copyImages();

        // Copy version
        await document.createRelated('_versions', { ...version, json }, trx);
      }),
    );

    // Copy user roles
    await self.fetchRelated('_userRoles', trx);
    await Promise.all(
      self._userRoles.map(async (userRole: any) => {
        await document
          .$relatedQuery('_userRoles', trx)
          .relate({ id: userRole.id, user: userRole.user });
      }),
    );

    // Copy group roles
    await self.fetchRelated('_groupRoles', trx);
    await Promise.all(
      self._groupRoles.map(async (groupRole: any) => {
        await document
          .$relatedQuery('_groupRoles', trx)
          .relate({ id: groupRole.id, group: groupRole.group });
      }),
    );

    // Copy children, one by one so copies created inside the tree are known
    for (const child of children) {
      if (!created.includes(child.uuid)) {
        await child.copy(
          document.uuid,
          `${path}/${child.id}`,
          child.id,
          trx,
          created,
        );
      }
    }

    // Index document
    await document.index(trx);

    // Return document
    return document;
  }

  /**
   * Is folderish
   * @method isFolderish
   * @return {boolean} True if folderish
   */
  isFolderish(): boolean {
    const self: InstanceType<typeof Document> = this;
    return self._type._schema.behaviors.includes('folderish');
  }

  /**
   * Get summary
   * @method getSummary
   * @return {string} Summary text
   */
  async getSummary(): Promise<string> {
    // If no AI model enabled, return empty string
    if (!config.settings.ai?.models?.llm?.enabled) {
      return '';
    }

    // Get searchable text
    const bodytext = await this.getBodytext();

    if (bodytext.length < 255) {
      return bodytext;
    }

    // Generate summary using AI model
    const result = await generate(
      'Give a one paragraph summary in plain text of the context.',
      [],
      { Context: bodytext },
    );
    return (result as any).response;
  }

  /**
   * Get bodytext
   * @method getBodytext
   * @return {string} Body text
   */
  async getBodytext(): Promise<string> {
    const self: InstanceType<typeof Document> = this;
    // Cache result
    if (self._cache?.bodytext) {
      return self._cache.bodytext;
    }

    const chunks: string[] = [];

    // Add all text blocks
    Object.values(self.json.blocks || {}).map((block: any) => {
      if (block['@type'] === 'slate' && block.plaintext) {
        chunks.push(block.plaintext);
      }
    });

    // Add vision data if enabled
    if (config.settings.ai?.models?.vision?.enabled) {
      const imageFields = getFactoryFields(self._type._schema, 'Image');

      imageFields.map((field: string) => {
        if (self.json[field]?.text) {
          chunks.push(self.json[field].text);
        }
      });
    }

    // Add text from indexed files
    const fileFields = getFactoryFields(self._type._schema, 'File');
    fileFields.map((field: string) => {
      if (self.json[field]?.text) {
        chunks.push(self.json[field].text);
      }
    });

    // Cache searchable text
    if (!self._cache) {
      self._cache = {};
    }
    self._cache.bodytext = chunks.join(' ');

    return self._cache.bodytext;
  }

  /**
   * Searchable text
   * @method searchableText
   * @return {string} Searchable text
   */
  async searchableText(): Promise<string> {
    // Return text from title, description and bodytext
    return compact([
      this.json.title,
      this.json.description,
      await this.getBodytext(),
    ]).join(' ');
  }

  /**
   * Get object size
   * @method getObjSize
   * @return {number} Object size
   */
  getObjSize(): number {
    return Buffer.byteLength(JSON.stringify(this.json), 'utf8');
  }

  /**
   * Get mime type
   * @method mimeType
   * @return {string} Mime type of the object
   */
  mimeType(): string | undefined {
    const self: InstanceType<typeof Document> = this;
    const imageFields = getFactoryFields(self._type._schema, 'Image');
    if (imageFields.length > 0) {
      return self.json[imageFields[0]]?.['content-type'];
    }
    const fileFields = getFactoryFields(self._type._schema, 'File');
    if (fileFields.length > 0) {
      return self.json[fileFields[0]]?.['content-type'];
    }
    return undefined;
  }

  /**
   * List of creators
   * @method listCreators
   * @return {Array} List of creators
   */
  listCreators(): string[] {
    return [this.owner];
  }

  /**
   * Fetch the roles which have the global 'View' permission
   * @method fetchGlobalViewRoles
   * @static
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Promise<string[]>} List of roles.
   */
  static async fetchGlobalViewRoles(trx?: Knex.Transaction): Promise<string[]> {
    const Permission = models.get('Permission');
    const view: any = await Permission.fetchById('View', {}, trx);
    if (!view) {
      return [];
    }
    await view.fetchRelated('_roles', trx);
    return view._roles.map((role: any) => role.id);
  }

  /**
   * Get the roles which have the 'View' permission in a workflow state
   * @method getViewRoles
   * @static
   * @param {Object} workflow Workflow json.
   * @param {string} state Workflow state.
   * @param {string[]} globalRoles Roles with the global 'View' permission.
   * @return {string[]} List of roles.
   */
  static getViewRoles(
    workflow: any,
    state: string,
    globalRoles: string[],
  ): string[] {
    const Workflow = models.get('Workflow');
    return uniq([
      ...(Workflow.isAcquired(workflow, state, 'View') ? globalRoles : []),
      ...Object.keys(
        pickBy(workflow?.states?.[state]?.permissions || {}, (value: any) =>
          value.includes('View'),
        ),
      ),
    ]);
  }

  /**
   * Get the roles which have the 'View' permission with a workflow chain:
   * every workflow of the chain applies its state in turn.
   * @method getChainViewRoles
   * @static
   * @param {Object[]} chain Workflow json and state of every workflow.
   * @param {string[]} globalRoles Roles with the global 'View' permission.
   * @return {string[]} List of roles.
   */
  static getChainViewRoles(
    chain: { json: any; state: string }[],
    globalRoles: string[],
  ): string[] {
    return chain.reduce(
      (roles: string[], { json, state }) =>
        Document.getViewRoles(json, state, roles),
      globalRoles,
    );
  }

  /**
   * Fetch the states of the further workflows of documents (the workflow
   * status, by document uuid and workflow).
   * @method fetchWorkflowStates
   * @static
   * @param {string[]} uuids Uuids of the documents.
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Promise<Object>} States by document uuid and workflow id.
   */
  static async fetchWorkflowStates(
    uuids: string[],
    trx?: Knex.Transaction,
  ): Promise<Record<string, Record<string, string>>> {
    const states: Record<string, Record<string, string>> = {};
    for (let i = 0; i < uuids.length; i += 1000) {
      (
        await (trx || Document.knex())('document_workflow_status')
          .select('document', 'workflow', 'state')
          .whereIn('document', uuids.slice(i, i + 1000))
      ).map((row: any) => {
        states[row.document] = {
          ...(states[row.document] || {}),
          [row.workflow]: row.state,
        };
      });
    }
    return states;
  }

  /**
   * Get the roles with 'View' of a document of a type, from the chains of
   * the types and the states of the further workflows.
   * @method getDocumentViewRoles
   * @static
   * @param {Object} document Document row (type, uuid, workflow_state).
   * @param {Object} chains Workflow chains by type id.
   * @param {Object} states States of further workflows by document uuid.
   * @param {string[]} globalRoles Roles with the global 'View' permission.
   * @return {string[]} List of roles.
   */
  static getDocumentViewRoles(
    document: any,
    chains: Record<string, any[]>,
    states: Record<string, Record<string, string>>,
    globalRoles: string[],
  ): string[] {
    const [primary, ...others] = chains[document.type] || [];
    return Document.getChainViewRoles(
      [
        { json: primary?.json, state: document.workflow_state },
        ...others.map((workflow: any) => ({
          json: workflow.json,
          state:
            states[document.uuid]?.[workflow.id] || workflow.json.initial_state,
        })),
      ],
      globalRoles,
    );
  }

  /**
   * Fetch the workflow chains of all types.
   * @method fetchChains
   * @static
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Promise<Object>} Workflows by type id.
   */
  static async fetchChains(
    trx?: Knex.Transaction,
  ): Promise<Record<string, any[]>> {
    const Type = models.get('Type');
    const types = await Type.fetchAll({}, { related: '_workflow' }, trx);
    const chains: Record<string, any[]> = {};
    for (const type of types.models || types) {
      chains[type.id] = await type.fetchChain(trx);
    }
    return chains;
  }

  /**
   * Get the allowed users, groups and roles
   * @method getAllowed
   * @static
   * @param {string[]} viewRoles Roles with the 'View' permission.
   * @param {Object[]} localRoles Local roles of the document.
   * @param {string} owner Owner of the document.
   * @return {string[]} List of allowed users, groups and roles.
   */
  static getAllowed(
    viewRoles: string[],
    localRoles: { principal: string; role: string }[],
    owner?: string,
  ): string[] {
    return uniq([
      ...viewRoles,
      // Sorted, so the result doesn't depend on the order in which the
      // local roles were collected (per document, by subtree or in batches)
      ...localRoles
        .filter((localRole) => viewRoles.includes(localRole.role))
        .map((localRole) => localRole.principal)
        .sort(),
      ...(owner && viewRoles.includes('Owner') ? [userToken(owner)] : []),
    ]);
  }

  /**
   * Fetch the local roles of documents, without inheritance
   * @method fetchLocalRolesByDocuments
   * @static
   * @param {string[]} uuids Uuids of the documents.
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Promise<Object>} Local roles by document uuid.
   */
  static async fetchLocalRolesByDocuments(
    uuids: string[],
    trx?: Knex.Transaction,
  ): Promise<Record<string, { principal: string; role: string }[]>> {
    const knex = trx || Document.knex();
    const localRoles: Record<string, { principal: string; role: string }[]> =
      {};
    for (let i = 0; i < uuids.length; i += 1000) {
      const chunk = uuids.slice(i, i + 1000);
      const users = await knex('user_role_document').whereIn('document', chunk);
      const groups = await knex('group_role_document').whereIn(
        'document',
        chunk,
      );
      users.map((row: any) => {
        localRoles[row.document] = [
          ...(localRoles[row.document] || []),
          { principal: userToken(row.user), role: row.role },
        ];
      });
      groups.map((row: any) => {
        localRoles[row.document] = [
          ...(localRoles[row.document] || []),
          { principal: groupToken(row.group), role: row.role },
        ];
      });
    }
    return localRoles;
  }

  /**
   * Fetch the local roles of this document including the inherited ones
   * @method fetchLocalRoles
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Promise<Object[]>} List of principals and roles.
   */
  async fetchLocalRoles(
    trx?: Knex.Transaction,
  ): Promise<{ principal: string; role: string }[]> {
    const self: InstanceType<typeof Document> = this;
    const knex = trx || Document.knex();

    // Get this document and the parents it inherits local roles from
    const chain = await knex.raw(
      `WITH RECURSIVE chain AS (
        SELECT uuid, parent, inherit_roles FROM document WHERE uuid = ?
        UNION ALL
        SELECT d.uuid, d.parent, d.inherit_roles FROM document d
          JOIN chain c ON d.uuid = c.parent WHERE c.inherit_roles
      ) SELECT uuid FROM chain`,
      [self.uuid],
    );
    const localRoles = await Document.fetchLocalRolesByDocuments(
      chain.rows.map((row: any) => row.uuid),
      trx,
    );
    return flatten(Object.values(localRoles));
  }

  /**
   * List of allowed users, groups and roles
   * @method allowedUsersGroupsRoles
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Promise<string[]>} List of allowed users and groups.
   */
  async allowedUsersGroupsRoles(trx?: Knex.Transaction): Promise<string[]> {
    const self: InstanceType<typeof Document> = this;

    // Get the roles with 'View' permission, given globally or by the
    // workflow states, and the local roles of the document
    return Document.getAllowed(
      Document.getChainViewRoles(
        (await self.fetchWorkflowChain(trx)).map(({ workflow, state }) => ({
          json: workflow.json,
          state,
        })),
        await Document.fetchGlobalViewRoles(trx),
      ),
      await self.fetchLocalRoles(trx),
      self.owner,
    );
  }

  /**
   * Reindex the allowed users, groups and roles of this document and all
   * documents below it
   * @method reindexSecurity
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Promise<number>} Number of reindexed documents.
   */
  async reindexSecurity(trx: Knex.Transaction): Promise<number> {
    const self: InstanceType<typeof Document> = this;
    const Type = models.get('Type');
    const knex = Document.knex();

    // Get the documents of the subtree, parents before children
    const documents: any[] = await knex('document')
      .select(
        'uuid',
        'parent',
        'inherit_roles',
        'owner',
        'type',
        'workflow_state',
      )
      .where('uuid', self.uuid)
      .orWhereRaw('path LIKE ?', [
        likePrefix(self.path === '/' ? '/' : `${self.path}/`),
      ])
      .orderByRaw('length(path)')
      .transacting(trx);
    if (documents.length === 0) {
      return 0;
    }

    // Get the workflow chains by type, the states of further workflows
    // and the global view roles
    const chains = await Document.fetchChains(trx);
    const chained = documents
      .filter((document) => (chains[document.type] || []).length > 1)
      .map((document) => document.uuid);
    const states =
      chained.length > 0
        ? await Document.fetchWorkflowStates(chained, trx)
        : {};
    const globalRoles = await Document.fetchGlobalViewRoles(trx);

    // Get the local roles inherited from above the subtree
    const top = documents[0];
    let inherited: { principal: string; role: string }[] = [];
    if (top.parent && top.inherit_roles) {
      const parent = await Document.fetchById(top.parent, {}, trx);
      inherited = parent ? await parent.fetchLocalRoles(trx) : [];
    }

    // Get the local roles of the subtree
    const own = await Document.fetchLocalRolesByDocuments(
      documents.map((document) => document.uuid),
      trx,
    );

    // Calculate the local roles and allowed principals top down
    const localRoles: Record<string, { principal: string; role: string }[]> =
      {};
    const allowed = documents.map((document) => {
      const above =
        document.uuid === top.uuid ? inherited : localRoles[document.parent];
      localRoles[document.uuid] = [
        ...(own[document.uuid] || []),
        ...(document.inherit_roles ? above || [] : []),
      ];
      return {
        document: document.uuid,
        allowed: Document.getAllowed(
          Document.getDocumentViewRoles(document, chains, states, globalRoles),
          localRoles[document.uuid],
          document.owner,
        ),
      };
    });

    // Update the catalog in batches
    for (let i = 0; i < allowed.length; i += 500) {
      await knex
        .raw(
          `UPDATE catalog SET "_allowedUsersGroupsRoles" = item.allowed
            FROM jsonb_to_recordset(?::jsonb) AS item(document uuid, allowed text[])
            WHERE catalog.document = item.document`,
          [JSON.stringify(allowed.slice(i, i + 500))],
        )
        .transacting(trx);
    }
    return allowed.length;
  }

  /**
   * Reindex the catalog of all documents, or of the documents of some
   * types, in batches. Types, workflows, indexes and local roles are
   * fetched once, the permissions are computed from the paths and every
   * batch is written with one statement in its own transaction, so other
   * changes don't wait for the whole reindex.
   * @method reindexCatalog
   * @static
   * @param {Object} options Types (default all), batch size and an abort
   * signal.
   * @return {Promise<number>} Number of reindexed documents.
   */
  static async reindexCatalog(
    options: {
      types?: string[];
      batchSize?: number;
      signal?: AbortSignal;
    } = {},
  ): Promise<number> {
    const Index = models.get('Index');
    const Type = models.get('Type');
    const knex = Document.knex();
    const batchSize = options.batchSize || 500;

    // Fetch what is the same for all documents
    const indexes = (await Index.fetchAll({}, {}, undefined)).models;
    const types: Record<string, any> = Object.fromEntries(
      (await Type.fetchAll({}, { related: '_workflow' })).map((type: any) => [
        type.id,
        type,
      ]),
    );
    const chains = await Document.fetchChains();
    const globalRoles = await Document.fetchGlobalViewRoles();
    const columns: Record<string, string> = Object.fromEntries(
      (
        await knex.raw(
          `SELECT attname, format_type(atttypid, atttypmod) AS type FROM pg_attribute
            WHERE attrelid = 'catalog'::regclass AND attnum > 0 AND NOT attisdropped`,
        )
      ).rows.map((row: any) => [row.attname, row.type]),
    );

    // Local roles and blocked inheritance by path, the other documents
    // have no local roles and inherit
    const local = new Map<
      string,
      { inherit: boolean; roles: { principal: string; role: string }[] }
    >();
    (
      await knex.raw(
        `SELECT d.path, d.inherit_roles, r."user", r."group", r.role FROM document d
          LEFT JOIN (
            SELECT document, "user", NULL AS "group", role FROM user_role_document
            UNION ALL
            SELECT document, NULL, "group", role FROM group_role_document
          ) r ON r.document = d.uuid
          WHERE r.document IS NOT NULL OR NOT d.inherit_roles`,
      )
    ).rows.forEach((row: any) => {
      const entry = local.get(row.path) || {
        inherit: row.inherit_roles,
        roles: [] as { principal: string; role: string }[],
      };
      if (row.role) {
        entry.roles.push({
          principal: row.user ? userToken(row.user) : groupToken(row.group),
          role: row.role,
        });
      }
      local.set(row.path, entry);
    });
    const localRoles = (document: any) => {
      let path = document.path;
      let roles = local.get(path)?.roles || [];
      let inherit = document.inherit_roles;
      while (inherit && path !== '/') {
        path = path.substring(0, path.lastIndexOf('/')) || '/';
        const entry = local.get(path);
        roles = [...roles, ...(entry?.roles || [])];
        inherit = entry ? entry.inherit : true;
      }
      return roles;
    };

    // Reindex the documents in batches ordered by uuid
    let count = 0;
    let lastUuid: string | undefined;
    for (;;) {
      if (options.signal?.aborted) {
        throw new Error('Reindex aborted');
      }
      const documents: any[] = await Document.query()
        .modify((query: any) => {
          if (options.types) {
            query.whereIn('type', options.types);
          }
          if (lastUuid) {
            query.where('uuid', '>', lastUuid);
          }
        })
        .orderBy('uuid')
        .limit(batchSize);
      if (documents.length === 0) {
        break;
      }

      // Get the states of further workflows
      const chained = documents
        .filter((document: any) => (chains[document.type] || []).length > 1)
        .map((document: any) => document.uuid);
      const states =
        chained.length > 0 ? await Document.fetchWorkflowStates(chained) : {};

      // Get the catalog fields of the documents
      const kinds: Record<string, { type: string; metadata: boolean }> = {};
      const rows = await mapAsync(documents, async (document: any) => {
        document._type = types[document.type];
        const fields = await document.getIndexFields(undefined, {
          indexes,
          values: {
            allowedUsersGroupsRoles: Document.getAllowed(
              Document.getDocumentViewRoles(
                document,
                chains,
                states,
                globalRoles,
              ),
              localRoles(document),
              document.owner,
            ),
          },
        });
        Object.keys(fields).forEach((name: string) => {
          kinds[name] = fields[name];
        });
        return {
          ...mapValues(fields, (field: any) =>
            field.type === 'embed' ? JSON.stringify(field.value) : field.value,
          ),
          document: document.uuid,
        };
      });

      // Write the batch with one statement
      const names = Object.keys(kinds).filter((name) => columns[name]);
      const value = (name: string) => {
        if (kinds[name].type === 'text' && !kinds[name].metadata) {
          return `to_tsvector('nick', v."${name}")`;
        }
        return kinds[name].type === 'embed'
          ? `v."${name}"::${columns[name]}`
          : `v."${name}"`;
      };
      const recordType = (name: string) =>
        kinds[name].type === 'embed' ||
        (kinds[name].type === 'text' && !kinds[name].metadata)
          ? 'text'
          : columns[name];
      await knex.transaction(async (trx: Knex.Transaction) => {
        await trx.raw(
          `INSERT INTO catalog (document, ${names.map((name) => `"${name}"`).join(', ')})
            SELECT v.document, ${names.map(value).join(', ')}
            FROM jsonb_to_recordset(?::jsonb) AS v(document uuid, ${names
              .map((name) => `"${name}" ${recordType(name)}`)
              .join(', ')})
            ON CONFLICT (document) DO UPDATE SET ${names
              .map((name) => `"${name}" = EXCLUDED."${name}"`)
              .join(', ')}`,
          [JSON.stringify(rows)],
        );
      });
      count += documents.length;
      lastUuid = documents[documents.length - 1].uuid;
    }
    return count;
  }

  /**
   * List of documents that are referenced by this document
   * @method isReferencing
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Promise<string[]>} List of documents.
   */
  async isReferencing(_trx?: Knex.Transaction): Promise<any[]> {
    const self: InstanceType<typeof Document> = this;

    // Get file fields
    const relationListFields = getFactoryFields(
      self._type._schema,
      'Relation List',
    );

    // Return allowed
    return flatten(
      relationListFields.map((field: string) => self.json[field] || []),
    );
  }

  /**
   * Has preview image
   * @method hasPreviewImage
   * @return {Boolean} True if has preview image
   */
  hasPreviewImage(): boolean {
    const self: InstanceType<typeof Document> = this;
    return isObject(self.json.preview_image) ||
      isObject(self.json.preview_image_link)
      ? true
      : false;
  }

  /**
   * Get block types
   * @method getBlockTypes
   * @return {Array} Array with block types
   */
  getBlockTypes(): string[] {
    const self: InstanceType<typeof Document> = this;
    return self.json.blocks
      ? uniq(
          flatten(
            Object.keys(self.json.blocks).map((block: string) => [
              self.json.blocks[block]['@type'],
              ...(self.json.blocks[block].blocks
                ? Object.keys(self.json.blocks[block].blocks).map(
                    (subblock: string) =>
                      self.json.blocks[block].blocks[subblock]['@type'],
                  )
                : []),
            ]),
          ),
        )
      : [];
  }

  /**
   * Get the image field
   * @method getImageField
   * @return {String} Image field
   */
  getImageField(): string {
    const self: InstanceType<typeof Document> = this;
    if (self._type._schema.properties.preview_image_link) {
      return 'preview_image_link';
    } else if (self._type._schema.properties.preview_image) {
      return 'preview_image';
    } else if (self._type._schema.properties.image) {
      return 'image';
    } else {
      return '';
    }
  }

  /**
   * Get image scales
   * @method getImageScales
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Object} Image scales object.
   */
  async getImageScales(trx?: Knex.Transaction): Promise<any> {
    const self: InstanceType<typeof Document> = this;
    const image_scales: any = {};
    const relationChoiceFields = getFactoryFields(
      self._type._schema,
      'Relation Choice',
    );
    const imageFields = getFactoryFields(self._type._schema, 'Image');

    const addDownload = (field: any) => {
      return {
        ...field,
        download: `@@images/${field.uuid}.${last(field.filename.split('.'))}`,
        scales: mapValues(field.scales, (scale: any) => ({
          width: scale.width,
          height: scale.height,
          download: `@@images/${scale.uuid}.${last(field.filename.split('.'))}`,
        })),
      };
    };

    // Add image fields
    imageFields.map((field: string) => {
      if (self.json[field]) {
        image_scales[field] = [addDownload(self.json[field])];
      }
    });

    // Add relation choice fields
    await Promise.all(
      relationChoiceFields.map(async (field: string) => {
        if (self.json[field] && self.json[field].length > 0) {
          const target = await Document.fetchById(
            self.json[field][0].UID,
            {},
            trx,
          );
          if (isObject(target.json.image)) {
            image_scales[field] = [
              { ...addDownload(target.json.image), base_path: target.path },
            ];
          }
        }
      }),
    );

    return image_scales;
  }

  /**
   * Re index children
   * @method reindexChildren
   * @param {Knex.Transaction} trx Transaction object.
   */
  async reindexChildren(trx: Knex.Transaction): Promise<any> {
    const self: InstanceType<typeof Document> = this;
    return mapAsync(
      self._children,
      async (child: any) => await child.index(trx, false),
    );
  }

  /**
   * Index children
   * @method indexChildren
   * @param {Knex.Transaction} trx Transaction object.
   */
  async indexChildren(trx: Knex.Transaction): Promise<any> {
    const self: InstanceType<typeof Document> = this;
    return mapAsync(
      self._children,
      async (child: any) => await child.index(trx),
    );
  }

  /**
   * Re index object
   * @method reindex
   * @param {Knex.Transaction} trx Transaction object.
   */
  async reindex(trx: Knex.Transaction): Promise<any> {
    return this.index(trx, false);
  }

  /**
   * Get the catalog fields of the document
   * @method getIndexFields
   * @param {Knex.Transaction} trx Transaction object.
   * @param {Object} options Indexes to use instead of fetching them and
   * values to use for some attributes instead of computing them.
   * @returns {Promise<Object>} Type, metadata flag and value by column.
   */
  async getIndexFields(
    trx?: Knex.Transaction,
    options: { indexes?: any[]; values?: Record<string, any> } = {},
  ): Promise<Record<string, any>> {
    const self: InstanceType<typeof Document> = this;
    const fields: any = {};

    // If type not found fetch type
    if (!self._type) {
      await self.fetchRelated('_type', trx);
    }

    // Apply behaviors not applied
    if (!self._behaviors) {
      await this.applyBehaviors(trx);
      self._behaviors = true;
    }

    // If workflow not found fetch workflow
    if (!self._type._workflow) {
      await self._type.fetchRelated('_workflow', trx);
    }

    // Fetch indexes
    const Index = models.get('Index');
    const indexes: any[] =
      options.indexes || (await Index.fetchAll({}, {}, trx)).models;

    // Loop indexes
    await mapAsync(indexes, async (index: any) => {
      const name = index.metadata ? index.name : `_${index.name}`;
      if (index.attr in self) {
        fields[name] = { type: index.type, metadata: index.metadata };
        if (options.values && index.attr in options.values) {
          fields[name].value = options.values[index.attr];
        } else if (isFunction((self as any)[index.attr])) {
          const value = (self as any)[index.attr](trx);
          fields[name].value = isPromise(value) ? await value : value;
        } else {
          fields[name].value = (self as any)[index.attr];
        }
        if (index.type === 'embed') {
          fields[name].value = await embed(fields[name].value);
        }
      } else if (index.attr in self._type._schema.properties) {
        fields[name] = {
          type: index.type,
          metadata: index.metadata,
          value:
            index.type === 'boolean'
              ? !!self.json[index.attr]
              : self.json[index.attr],
        };
      }
    });

    // Remove undefined
    return omitBy(fields, (field: any) => isUndefined(field.value));
  }

  /**
   * Index object
   * @method index
   * @param {Knex.Transaction} trx Transaction object.
   * @param {boolean} insert Insert or update.
   */
  async index(trx: Knex.Transaction, insert = true): Promise<void> {
    const self: InstanceType<typeof Document> = this;
    const fields = await self.getIndexFields(trx);

    // Get knex
    const knex = Document.knex();

    // Create catalog entry
    if (insert) {
      // Add document
      fields['document'] = { type: 'uuid', value: self.uuid };

      // Insert into catalog
      await knex
        .raw(
          `INSERT INTO catalog ("${Object.keys(fields).join('", "')}") VALUES (${Object.keys(
            fields,
          )
            .map((field) =>
              fields[field].type === 'text' && !fields[field].metadata
                ? "to_tsvector('nick', ?)"
                : '?',
            )
            .join(', ')});`,
          Object.values(fields).map((field: any) => field.value),
        )
        .transacting(trx);
    } else {
      // Insert into catalog
      await knex
        .raw(
          `UPDATE catalog SET ${Object.keys(fields)
            .map(
              (key) =>
                `"${key}" = ${fields[key].type === 'text' && !fields[key].metadata ? "to_tsvector('nick', ?)" : '?'} `,
            )
            .join(', ')} WHERE document = '${self.uuid}';`,
          Object.values(fields).map((field: any) => field.value),
        )
        .transacting(trx);
    }
  }

  /**
   * Fetch children.
   * @method fetchChildren
   * @param {any} _req Request object.
   * @param {Knex.Transaction} trx Transaction object.
   * @param {boolean} types Flag to include types in the output.
   * @return {Promise<void>} No return value.
   */
  async fetchChildren(
    _req: any,
    trx?: Knex.Transaction,
    types: boolean = true,
  ): Promise<void> {
    const self: InstanceType<typeof Document> = this;
    if (types) {
      // Reuse the type of the document if it is already fetched. One
      // relation at a time: objection fetches sibling relations in
      // parallel, and a transaction has only one connection.
      if (!self._type) {
        await self.fetchRelated('_type', trx);
      }
      await self.fetchRelated('_children(order)._type', trx);
    } else {
      await self.fetchRelated('_children(order)', trx);
    }
    self._children = self._children.filter(
      (item: InstanceType<typeof Document>) => !item.deleted,
    );
  }

  /**
   * Fetch reference to the model.
   * @method fetchReference
   * @param {string} field Field name.
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Promise<void>} No return value.
   */
  async fetchReference(field: string, trx?: Knex.Transaction): Promise<void> {
    const self: InstanceType<typeof Document> = this;
    self.json[`_${field}`] = await Document.fetchOne(
      { uuid: self.json[field][0].UID },
      {},
      trx,
    );
  }

  /**
   * Convert document to RSS format
   * @method toRSS
   * @param {Request} req Request object.
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Promise<string>} RSS string
   */
  async toRSS(req: Request, trx: Knex.Transaction): Promise<string> {
    const self: InstanceType<typeof Document> = this;
    await self.fetchRelated('_owner', trx);

    return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>${self.json.title}</title>
    <description>${self.json.description || ''}</description>
    <language>${self.language || 'en'}</language>
    <link>${self.getUrl(req)}</link>
    <lastBuildDate>${dayjs().utc().format('ddd, DD MMM YYYY HH:mm:ss [GMT]')}</lastBuildDate>
    ${self._owner ? `<managingEditor>${self._owner.email} (${self._owner.fullname})</managingEditor>` : ''}
${self._restrictedChildren
  .map(
    (child: any) => `      <item>
        <title>${child.json.title}</title>
        <link>${child.getUrl(req)}</link>
        <guid>${child.uuid}</guid>
        <pubDate>${dayjs(child.created).utc().format('ddd, DD MMM YYYY HH:mm:ss [GMT]')}</pubDate>
        <description>${child.json.description || ''}</description>
      </item>`,
  )
  .join('\n')}
  </channel>
</rss>`;
  }

  /**
   * Convert document to ICS format
   * @method toICS
   * @param {Request} req Request object.
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Promise<string>} ICS string
   */
  async toICS(req: Request, trx: Knex.Transaction): Promise<string> {
    const self: InstanceType<typeof Document> = this;
    const Controlpanel = models.get('Controlpanel');

    // Fetch settings
    const controlpanel = await Controlpanel.fetchById('site', {}, trx);
    const settings = controlpanel.data;

    let events = self.toICSEvent();
    if (!events) {
      events = self._restrictedChildren
        .map((item: any) => item.toICSEvent())
        .filter((ics: any) => ics !== null)
        .join('\n');
    }

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//${settings.site_title}//NONSGML Nick//EN
X-WR-TIMEZONE:UTC${events ? `\n${events}` : ''}
END:VCALENDAR`;
  }

  /**
   * Convert document to ICS event format
   * @method toICSEvent
   * @return {string | null} ICS string or null if start or end date is missing
   */
  toICSEvent(): string | null {
    const self: InstanceType<typeof Document> = this;

    // Check if start date is available
    if (!self.json.start) {
      return null;
    }

    // Set event data
    const event = {
      SUMMARY: self.json.title,
      DTSTART: dayjs(self.json.start).utc().format('YYYYMMDDTHHmmss[Z]'),
      DTSTAMP: dayjs().utc().format('YYYYMMDDTHHmmss[Z]'),
      UID: `${self.uuid}@${config.settings.frontendUrl}`,
      CREATED: dayjs(self.created).utc().format('YYYYMMDDTHHmmss[Z]'),
      'LAST-MODIFIED': dayjs(self.modified).utc().format('YYYYMMDDTHHmmss[Z]'),
      URL: `${config.settings.frontendUrl}${self.path === '/' ? '' : self.path}`,
    } as any;

    // Add end date if available
    if (self.json.end) {
      event.DTEND = dayjs(self.json.end).utc().format('YYYYMMDDTHHmmss[Z]');
    }

    // Add recurrence rule if available
    if (self.json.recurrence) {
      self.json.recurrence.split('\n').forEach((rule: string) => {
        const [key, value] = rule.split(':');
        event[key] = value;
      });
    }

    return `BEGIN:VEVENT
${Object.keys(event)
  .map((key) => `${key}:${event[key]}`)
  .join('\n')}
END:VEVENT`;
  }

  /**
   * Delete files and images associated with the document
   * @param {Knex.Transaction} trx
   * @return {*}  {Promise<void>}
   */
  async deleteFilesAndImages(trx: Knex.Transaction): Promise<void> {
    const self: InstanceType<typeof Document> = this;
    if (!self._type) {
      await self.fetchRelated('_type', trx);
    }

    // Get file and image fields
    const fileFields = getFactoryFields(self._type._schema, 'File');
    const imageFields = getFactoryFields(self._type._schema, 'Image');

    // If file fields exist
    if (fileFields.length > 0 || imageFields.length > 0) {
      // Get versions
      await self.fetchRelated('_versions', trx);

      // Get all file uuids from all versions and all fields
      const files = uniq(
        flattenDeep(
          self._versions.map((version: any) => [
            ...fileFields.map((field: string) => version.json[field].uuid),
            ...imageFields.map((field: string) => [
              version.json[field].uuid,
              ...Object.keys(config.settings.imageScales).map(
                (scale) => version.json[field].scales[scale].uuid,
              ),
            ]),
          ]),
        ),
      );

      // Remove files
      await mapAsync(files, async (file: any) => await removeFile(file, trx));
    }
  }

  /**
   * Convert document to Markdown format
   * @returns {string} Markdown string
   */
  toMarkdown(): string {
    const self: InstanceType<typeof Document> = this;

    return (self.json.blocks_layout?.items || [])
      .map((block: any) => {
        return blocks
          .get(self.json.blocks[block]['@type'])
          .toMarkdown(self.json.blocks[block], self);
      })
      .join('');
  }
}
