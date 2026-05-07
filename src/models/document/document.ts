/**
 * Document Model.
 * @module models/document/document
 */

// Type imports
import type { Knex } from 'knex';
import type { Json, Request } from '../../types';

// External imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { compact, drop, flatten, head, last, uniq } from 'es-toolkit/array';
import { isEmpty, isObject } from 'es-toolkit/compat';
import { mapValues, omit, omitBy, pick, pickBy } from 'es-toolkit/object';
import { isFunction, isUndefined } from 'es-toolkit/predicate';
import { v4 as uuid } from 'uuid';

// Internal imports
import models from '../';
import { Model } from '../_model/_model';
import behaviors from '../../behaviors';
import { DocumentCollection } from '../../collections/document/document';
import languages from '../../constants/languages';
import { generate, embed } from '../../helpers/ai/ai';
import config from '../../helpers/config/config';
import { copyFile } from '../../helpers/fs/fs';
import { lockExpired } from '../../helpers/lock/lock';
import { slateToMarkdown } from '../../helpers/markdown/markdown';
import { getRootUrl } from '../../helpers/url/url';
import {
  isPromise,
  mapAsync,
  mapSync,
  uniqueId,
} from '../../helpers/utils/utils';

dayjs.extend(utc);

/**
 * A model for Document.
 * @class Document
 * @extends Model
 */
export class Document extends Model {
  static collection: (typeof Model)['collection'] =
    DocumentCollection as unknown as (typeof Model)['collection'];

  static idColumn: string = 'uuid';

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
        relation: (Model as any).BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'document.owner',
          to: 'user.id',
        },
      },
      _parent: {
        relation: (Model as any).BelongsToOneRelation,
        modelClass: Document,
        join: {
          from: 'document.parent',
          to: 'document.uuid',
        },
      },
      _children: {
        relation: (Model as any).HasManyRelation,
        modelClass: Document,
        join: {
          from: 'document.uuid',
          to: 'document.parent',
        },
      },
      _catalog: {
        relation: (Model as any).BelongsToOneRelation,
        modelClass: Catalog,
        join: {
          from: 'document.uuid',
          to: 'catalog.document',
        },
      },
      _versions: {
        relation: (Model as any).HasManyRelation,
        modelClass: Version,
        join: {
          from: 'document.uuid',
          to: 'version.document',
        },
      },
      _type: {
        relation: (Model as any).BelongsToOneRelation,
        modelClass: Type,
        join: {
          from: 'document.type',
          to: 'type.id',
        },
      },
      _userRoles: {
        relation: (Model as any).ManyToManyRelation,
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
        relation: (Model as any).ManyToManyRelation,
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
        relation: (Model as any).ManyToManyRelation,
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
   * Fetch version
   * @method fetchVersion
   * @param {string} document Uuid of the document
   * @param {Knex.Transaction} trx Transaction object.
   */
  async fetchVersion(version: any, trx?: Knex.Transaction): Promise<void> {
    (this as any)._version = await (this as any)
      .$relatedQuery('_versions', trx)
      .where({ version })
      .first();
  }

  /**
   * Apply behaviors
   * @param {Knex.Transaction} trx Transaction object.
   * @method applyBehaviors
   */
  async applyBehaviors(trx?: Knex.Transaction): Promise<void> {
    const self: any = this;
    // If type not found fetch type
    if (!self._type) {
      await self.fetchRelated('_type', trx);
    }

    // Assign behaviors
    Object.assign(
      self,
      ...Object.values(pick(behaviors, self._type.schema.behaviors)),
    );
  }

  /**
   * Set restricted children
   * @method restrictChildren
   * @param {Request} req Request object.
   * @param {Knex.Transaction} trx Transaction object.
   */
  async restrictChildren(req: Request, trx?: Knex.Transaction): Promise<void> {
    const self: any = this;
    const Catalog = models.get('Catalog');
    const paths = (self._children || []).map((child: any) => child.path);
    const items = await Catalog.fetchAllRestricted(
      { _path: ['=', paths] },
      {},
      trx,
      req,
    );
    const restrictedPaths = (items as any).map((item: any) => item._path);
    self._restrictedChildren = (self._children || []).filter((child: any) =>
      restrictedPaths.includes(child.path),
    );
  }

  /**
   * Fetch relation lists
   * @method fetchRelationLists
   * @param {Knex.Transaction} trx Transaction object.
   */
  async fetchRelationLists(trx?: Knex.Transaction): Promise<void> {
    const self: any = this;
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
    const relationListFields = self._type.getFactoryFields('Relation List');
    await Promise.all(
      relationListFields.map(async (field: string) => {
        // Check if related documents
        if (Array.isArray(json[field]) && json[field].length > 0) {
          self._relationLists[field] = await Document.fetchAll(
            {
              uuid: ['=', json[field]],
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
    const self: any = this;
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
    (this as any).id = uniqueId(id || '', blacklist);
  }

  /**
   * Get title
   * @method getTitle
   * @returns {string} Title
   */
  getTitle(): string {
    return (this as any).json.title;
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
    trx?: Knex.Transaction,
  ): Promise<void> {
    const Redirect = models.get('Redirect');
    const documents: any = await this.fetchAll(
      { path: ['~', `^${oldPath}`] },
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
    await knex
      .raw(
        `update document set path = regexp_replace(path, '^${oldPath}/(.*)$', '${newPath}/\\1', 'g') where path ~ '^${oldPath}/.*$'`,
      )
      .transacting(trx as any);
    await knex
      .raw(
        `update catalog set _path = regexp_replace(_path, '^${oldPath}/(.*)$', '${newPath}/\\1', 'g') where _path ~ '^${oldPath}/.*$'`,
      )
      .transacting(trx as any);
  }

  /**
   * Reorder
   * @method reorder
   * @param {string} id Id of item to order.
   * @param {number|string} delta 'top', 'bottom' or numerical offset.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise} A Promise that resolves when the ordering has been done.
   */
  async reorder(id: string, delta: any, trx?: Knex.Transaction): Promise<void> {
    const self: any = this;
    let to: number;
    const from = (self._children || []).findIndex(
      (child: any) => child.id === id,
    );

    // Set to based on delta
    if (delta === 'top') {
      to = 0;
    } else if (delta === 'bottom') {
      to = self._children.length - 1;
    } else {
      to = from + delta;
    }

    // Reorder and save to db
    self._children.splice(to, 0, self._children.splice(from, 1)[0]);
    await this.fixOrder(trx);
  }

  /**
   * Fix order
   * @method fixOrder
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise} A Promise that resolves when the ordering has been done.
   */
  async fixOrder(trx?: Knex.Transaction): Promise<any> {
    const self: any = this;
    return await Promise.all(
      self._children.map(
        async (child: any, index: number) =>
          await child.update({ position_in_parent: index }, trx),
      ),
    );
  }

  /**
   * Returns JSON data.
   * @method toJson
   * @param {Request} req Request object.
   * @returns {Promise<Json>} JSON object.
   */
  async toJson(req: Request, components: any = {}): Promise<Json> {
    const self: any = this;
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
      const fileFields = self._type.getFactoryFields('File');
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
      const imageFields = self._type.getFactoryFields('Image');
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
      const relationListFields = self._type.getFactoryFields('Relation List');
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
      lock:
        self.lock.locked && lockExpired(self)
          ? {
              locked: false,
              stealable: true,
            }
          : self.lock,
    } as Json;
  }

  /**
   * Traverse path.
   * @method traverse
   * @param {Array} slugs Array of slugs.
   * @param {Object} user Current user object.
   * @param {Array} roles Array of roles.
   * @param {Object} trx Transaction object.
   * @returns {Promise<Object>} A Promise that resolves to an object.
   */
  async traverse(
    slugs: string[],
    user: any,
    roles: string[],
    navroot: any,
    trx?: Knex.Transaction,
  ): Promise<any> {
    const self: any = this;
    // Check if at leaf node
    if (slugs.length === 0) {
      // Add owner to roles if current document owned by user
      const extendedRoles = uniq([
        ...roles,
        ...(user.id === self.owner ? ['Owner'] : []),
      ]);

      // Return document and authorization data
      return {
        document: self,
        localRoles: extendedRoles,
        navroot,
      };
    } else {
      // Fetch child matching the id
      const child: any = await Document.fetchOne(
        {
          parent: self.uuid,
          id: head(slugs),
        },
        {},
        trx,
      );

      // Check if child not found
      if (!child) {
        return false;
      }

      // Fetch roles based on user and group from child
      const childRoles = await user.fetchUserGroupRolesByDocument(
        child.uuid,
        trx,
      );

      // Fetch navroot
      await child.fetchRelated('_type', trx);
      const is_navroot = child._type
        ? child._type._schema.behaviors.includes('navigation_root')
        : false;

      // Recursively call the traverse on child
      return child.traverse(
        drop(slugs, 1),
        user,
        child.inherit_roles ? uniq([...roles, ...childRoles]) : childRoles,
        is_navroot ? child : navroot,
        trx,
      );
    }
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
    const User = models.get('User');
    return await Promise.all(
      (this as any).workflow_history.map(async (item: any) => {
        const user = await User.fetchById(item.actor, {}, trx);
        return {
          ...item,
          actor: {
            '@id': `${getRootUrl(req)}/@users/${user.id}`,
            fullname: user.fullname,
            id: user.id,
            username: user.id,
          },
          comments: '',
          type: 'workflow',
        };
      }),
    );
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
   */
  async changeWorkflow(
    transition: string,
    actor: any,
    modified: string,
    recursive: boolean,
    trx: Knex.Transaction,
    req: Request,
  ): Promise<void> {
    const self: any = this;

    // Fetch type and workflow
    if (!self._type) {
      await self.fetchRelated('_type', trx);
    }
    if (!self._type._workflow) {
      await self._type.fetchRelated('_workflow', trx);
    }

    // Get prev state
    const old_state = self.workflow_state;
    const new_state =
      self._type._workflow.json.transitions[transition]?.new_state;

    // Check if state is available
    if (new_state) {
      // Add to workflow history
      const workflow_history = self.workflow_history;
      workflow_history.push({
        time: modified,
        actor: actor.id,
        action: transition,
        state_title: self._type._workflow.json.states[new_state].title,
        review_state: new_state,
        transition_title:
          self._type._workflow.json.transitions[transition].title,
      });

      // Trigger on before change workflow
      await config.settings.events.trigger(
        'onBeforeChangeWorkflow',
        self,
        actor,
        trx,
        transition,
        new_state,
      );

      // Update document
      await self.updateAndFetch(
        {
          modified: modified,
          workflow_state: new_state,
          workflow_history: JSON.stringify(workflow_history),
        },
        trx,
      );

      // Reindex document
      await self.reindex(trx);

      // Trigger on after change workflow
      await config.settings.events.trigger(
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
      await self.fetchRelated('_children', trx);
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
   */
  async copy(
    parent: string,
    path: string,
    id: string,
    trx?: Knex.Transaction,
  ): Promise<any> {
    const self: any = this;
    // Get json
    let json: any = self.json;

    // Get type information
    await self.fetchRelated('_type', trx);

    // Store used uuids
    const fileUuid: Record<string, string> = {};
    const fileFields = self._type.getFactoryFields('File');
    const imageFields = self._type.getFactoryFields('Image');

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
      },
      {},
      trx,
    );

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

    // Copy children
    await self.fetchRelated('_children', trx);
    await Promise.all(
      self._children.map(async (child: any) => {
        await child.copy(document.uuid, `${path}/${child.id}`, child.id, trx);
      }),
    );

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
    const self: any = this;
    return self._type._schema.behaviors.includes('folderish');
  }

  /**
   * Get summary
   * @method getSummary
   * @return {string} Summary text
   */
  async getSummary(): Promise<string> {
    const self: any = this;
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
    const self: any = this;
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
      const imageFields = await self._type.getFactoryFields('Image');

      imageFields.map((field: string) => {
        chunks.push(self.json[field].text);
      });
    }

    // Add text from indexed files
    const fileFields = await self._type.getFactoryFields('File');
    fileFields.map((field: string) => {
      chunks.push(self.json[field].text);
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
      (this as any).json.title,
      (this as any).json.description,
      await this.getBodytext(),
    ]).join(' ');
  }

  /**
   * Get object size
   * @method getObjSize
   * @return {number} Object size
   */
  getObjSize(): number {
    return Buffer.byteLength(JSON.stringify((this as any).json), 'utf8');
  }

  /**
   * Get mime type
   * @method mimeType
   * @return {string} Mime type of the object
   */
  mimeType(): string | undefined {
    const self: any = this;
    const imageFields = self._type.getFactoryFields('Image');
    if (imageFields.length > 0) {
      return self.json[imageFields[0]]?.['content-type'];
    }
    const fileFields = self._type.getFactoryFields('File');
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
    return [(this as any).owner];
  }

  /**
   * List of allowed users, groups and roles
   * @method allowedUsersGroupsRoles
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Promise<string[]>} List of allowed users and groups.
   */
  async allowedUsersGroupsRoles(trx?: Knex.Transaction): Promise<string[]> {
    const self: any = this;
    const Permission = models.get('Permission');
    // Get global roles
    const view: any = await Permission.fetchById('View', {}, trx);
    await view.fetchRelated('_roles', trx);
    const globalRoles = view._roles.map((role: any) => role.id);

    // Get workflow roles
    const workflowRoles = Object.keys(
      pickBy(
        self._type._workflow.json.states[self.workflow_state].permissions,
        (value: any) => value.includes('View'),
      ),
    );

    // Get users and groups from local roles with 'View' permission
    const localUsersGroups = await this.fetchLocalUsersGroups(globalRoles, trx);

    // Return allowed
    return uniq([...globalRoles, ...workflowRoles, ...localUsersGroups]);
  }

  /**
   * List of documents that are referenced by this document
   * @method isReferencing
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Promise<string[]>} List of documents.
   */
  async isReferencing(trx?: Knex.Transaction): Promise<string[]> {
    const self: any = this;

    // Return allowed
    return [];
  }

  /**
   * Has preview image
   * @method hasPreviewImage
   * @return {Boolean} True if has preview image
   */
  hasPreviewImage(): boolean {
    const self: any = this;
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
    const self: any = this;
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
    const self: any = this;
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
    const self: any = this;
    const image_scales: any = {};
    const relationChoiceFields = self._type.getFactoryFields('Relation Choice');
    const imageFields = self._type.getFactoryFields('Image');

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
   * Fetch local users and groups.
   * @method fetchLocalUsersGroups
   * @param {Array} viewRoles List of roles with the view permission.
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Promise<string[]>} List of allowed users and groups.
   */
  async fetchLocalUsersGroups(
    viewRoles: string[],
    trx?: Knex.Transaction,
  ): Promise<string[]> {
    const self: any = this;
    let localUsersGroups: string[] = [];

    // Fetch local user and group roles
    await self.fetchRelated('[_userRoles, _groupRoles]', trx);

    // Append user roles
    self._userRoles.map((role: any) => {
      if (viewRoles.includes(role.id)) {
        localUsersGroups.push(role.user);
      }
    });

    // Append group roles
    self._groupRoles.map((role: any) => {
      if (viewRoles.includes(role.id)) {
        localUsersGroups.push(role.group);
      }
    });

    // Check if we should traverse up
    if (self.parent && self.inherit_roles) {
      // Fetch parent
      await self.fetchRelated('_parent', trx);

      // Append parent users and groups
      localUsersGroups = [
        ...localUsersGroups,
        ...(await self._parent.fetchLocalUsersGroups(viewRoles, trx)),
      ];
    }
    return uniq(localUsersGroups);
  }

  /**
   * Re index children
   * @method reindexChildren
   * @param {Knex.Transaction} trx Transaction object.
   */
  async reindexChildren(trx?: Knex.Transaction): Promise<any> {
    const self: any = this;
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
  async indexChildren(trx?: Knex.Transaction): Promise<any> {
    const self: any = this;
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
  async reindex(trx?: Knex.Transaction): Promise<any> {
    return this.index(trx, false);
  }

  /**
   * Index object
   * @method index
   * @param {Knex.Transaction} trx Transaction object.
   * @param {boolean} insert Insert or update.
   */
  async index(trx?: Knex.Transaction, insert = true): Promise<void> {
    const self: any = this;
    let fields: any = {};

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
    const indexes: any = await Index.fetchAll({}, {}, trx);

    // Loop indexes
    await mapAsync((indexes as any).models, async (index: any) => {
      const name = index.metadata ? index.name : `_${index.name}`;
      if (index.attr in self) {
        fields[name] = { type: index.type, metadata: index.metadata };
        if (isFunction((self as any)[index.attr])) {
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

    // Get knex
    const knex = Document.knex();

    // Remove undefined
    fields = omitBy(fields, (field: any) => isUndefined(field.value));

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
                ? 'to_tsvector(?)'
                : '?',
            )
            .join(', ')});`,
          Object.values(fields).map((field: any) => field.value),
        )
        .transacting(trx as any);
    } else {
      // Insert into catalog
      await knex
        .raw(
          `UPDATE catalog SET ${Object.keys(fields)
            .map(
              (key) =>
                `"${key}" = ${fields[key].type === 'text' && !fields[key].metadata ? 'to_tsvector(?)' : '?'} `,
            )
            .join(', ')} WHERE document = '${self.uuid}';`,
          Object.values(fields).map((field: any) => field.value),
        )
        .transacting(trx as any);
    }
  }

  /**
   * Fetch children.
   * @method fetchChildren
   * @param {Request} req Request object.
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Promise<void>} No return value.
   */
  async fetchChildren(_req: Request, trx?: Knex.Transaction): Promise<void> {
    const self: any = this;
    await self.fetchRelated('[_children(order)._type, _type]', trx);
  }

  /**
   * Fetch reference to the model.
   * @method fetchReference
   * @param {string} field Field name.
   * @param {Knex.Transaction} trx Transaction object.
   * @return {Promise<void>} No return value.
   */
  async fetchReference(field: string, trx?: Knex.Transaction): Promise<void> {
    const self: any = this;
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
    const self: any = this;
    await self.fetchRelated('_owner', trx);

    return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>${self.json.title}</title>
    <description>${self.json.description || ''}</description>
    <language>${self.language || 'en'}</language>
    <link>${self.getUrl(req)}</link>
    <lastBuildDate>${dayjs().utc().format('ddd, DD MMM YYYY HH:mm:ss [GMT]')}</lastBuildDate>
    <managingEditor>${self._owner.email} (${self._owner.fullname})</managingEditor>
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
    const self: any = this;
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
    const self: any = this;

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
   * Convert document to Markdown format
   * @returns {string} Markdown string
   */
  toMarkdown(): string {
    const self: any = this;

    return (self.json.blocks_layout?.items || [])
      .map((block: any) => {
        switch (self.json.blocks[block]['@type']) {
          case 'title':
            return `# ${self.json.title}\n\n`;
          case 'slate':
            return slateToMarkdown(self.json.blocks[block].value);
          default:
            return '';
        }
      })
      .join('');
  }
}
