/**
 * Content routes.
 * @module routes/content/content
 */

// Type imports
import type { Request } from '../../types';
import type { Knex } from 'knex';

// External imports
import express from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { drop, flattenDeep, intersection, uniq } from 'es-toolkit/array';
import { omit, pick } from 'es-toolkit/object';
import { v4 as uuid } from 'uuid';

// Internal imports
import events from '../../events';
import { checkETag } from '../../helpers/cache/cache';
import config from '../../helpers/config/config';
import {
  getComponents,
  handleBlockReferences,
  handleFiles,
  handleImages,
  handleRelationLists,
} from '../../helpers/content/content';
import { RequestException } from '../../helpers/error/error';
import { readFile, removeFile } from '../../helpers/fs/fs';
import { lockExpired } from '../../helpers/lock/lock';
import { getRootUrl } from '../../helpers/url/url';
import { mapAsync, uniqueId, bytesToNumber } from '../../helpers/utils/utils';
import models from '../../models';

dayjs.extend(utc);

const omitProperties = ['@type', 'id', 'changeNote', 'language'];

export default [
  {
    op: 'post',
    view: '/@move',
    permission: 'Add',
    client: 'moveContent',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Document = models.get('Document');

      // Get children
      await req.document.fetchRelated('_children', trx);
      const childIds = req.document._children.map(
        (child: InstanceType<typeof Document>) => child.id,
      );

      // Return items
      const items = [] as { source: string; target: string }[];

      // Loop through source objects to be moved
      const sources = Array.isArray(req.body.source)
        ? req.body.source
        : [req.body.source];
      await mapAsync(sources, async (source: string) => {
        // Get item to be moved
        const document = await Document.fetchOne({ path: source }, {}, trx);

        // If moved to same folder or subfolder do nothing
        if (
          req.document.uuid === document.parent ||
          req.document.path.includes(document.path)
        ) {
          items.push({
            source,
            target: source,
          });
        } else {
          // Get current (previous) parent of document to be moved
          const parent = await Document.fetchById(document.parent, {}, trx);

          // Calculate new id and path
          const path = req.document.path;
          const newId = uniqueId(document.id, childIds);
          const newPath = `${path}${path === '/' ? '' : '/'}${newId}`;

          // Add new id to list of taken ids
          childIds.push(newId);

          // Replace path of moved object and children
          await Document.replacePath(source, newPath, trx);

          // Save document in new location
          await document.updateAndFetch(
            {
              parent: req.document.uuid,
              position_in_parent: 32767,
              path: newPath,
            },
            trx,
          );

          // Fetch children of previous parent
          await parent.fetchChildren({}, trx, false);
          await parent.fixOrder(trx);

          // Reindex siblings
          await parent.reindexChildren(trx);

          // Trigger on after move
          await events.trigger('onAfterMove', document, req.user, trx, source);

          // Add items to return array
          items.push({
            source,
            target: newPath,
          });
        }
      });

      // Fetch new children and fix order
      await req.document.fetchChildren({}, trx, false);
      await req.document.fixOrder(trx);

      // Reindex children
      await req.document.reindexChildren(trx);

      return {
        json: items.map((item) => ({
          source: `${getRootUrl(req)}${item.source}`,
          target: `${getRootUrl(req)}${item.target}`,
        })),
      };
    },
  },
  {
    op: 'post',
    view: '/@copy',
    permission: 'Add',
    client: 'copyContent',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Document = models.get('Document');

      // Get children
      await req.document.fetchChildren({}, trx, false);
      const childIds = req.document._children.map(
        (child: InstanceType<typeof Document>) => child.id,
      );

      // Return items
      const items = [] as { source: string; target: string }[];

      // Loop through source objects to be copied
      const sources = Array.isArray(req.body.source)
        ? req.body.source
        : [req.body.source];
      await mapAsync(sources, async (source: string) => {
        // Get item to be copied
        const document = await Document.fetchOne({ path: source }, {}, trx);

        // Calculate new id and path
        const path = req.document.path;
        const newId = uniqueId(document.id, childIds);
        const newPath = `${path}${path === '/' ? '' : '/'}${newId}`;

        // Add new id to list of taken ids
        childIds.push(newId);

        // Trigger on before copy
        await events.trigger('onBeforeCopy', document, req.user, trx);

        // Copy object
        const copiedDocument = await document.copy(
          req.document.uuid,
          newPath,
          newId,
          trx,
        );
        await copiedDocument.fetchRelated('_parent', trx);

        // Trigger on after copy
        await events.trigger(
          'onAfterCopy',
          copiedDocument,
          req.user,
          trx,
          source,
        );

        // Add items to return array
        items.push({
          source,
          target: newPath,
        });
      });

      // Fetch new children and fix order
      await req.document.fetchChildren({}, trx, false);
      await req.document.fixOrder(trx);

      // Reindex children
      await req.document.reindexChildren(trx);

      return {
        json: items.map((item) => ({
          source: `${getRootUrl(req)}${item.source}`,
          target: `${getRootUrl(req)}${item.target}`,
        })),
      };
    },
  },
  {
    op: 'get',
    view: '/@history/:version',
    permission: 'View',
    client: 'getHistoryVersion',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      await req.document.fetchChildren({}, trx);
      await req.document.fetchVersion(parseInt(req.params.version, 10), trx);
      await req.document.fetchRelationLists(trx);
      return {
        json: await handleBlockReferences(
          await req.document.toJson(
            req,
            await getComponents(req, trx, req.query?.expand?.split(',') || []),
          ),
          trx,
        ),
        xkeys: [req.document.uuid],
      };
    },
  },
  {
    op: 'get',
    view: '/@@videos/:field',
    // permission: 'View',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const field = req.document.json[req.params.field];
      const uuid = field.uuid;

      // Check if current etag
      if (checkETag(req, uuid)) {
        return {
          status: 304,
        };
      }

      // Fetch file
      const buffer = await readFile(uuid, trx);

      // Get chunk size
      const chunkSize = bytesToNumber(
        config.settings.requestLimit?.chunk || '1mb',
      );
      const size = buffer.length;

      // Check range
      const range = req.headers.range || `bytes=0-`;
      let [start, end] = range
        .replace(/bytes=/, '')
        .split('-')
        .map((x) => parseInt(x, 10));
      if (isNaN(start)) {
        start = 0;
      }
      if (isNaN(end)) {
        end = Math.min(start + chunkSize - 1, size - 1);
      }

      return {
        headers: {
          'content-type': field['content-type'],
          'content-disposition': `attachment; filename="${field.filename}"`,
          'content-length': end - start + 1,
          'content-range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
        },
        status: start === 0 && end === size - 1 ? 200 : 206,
        etag: uuid,
        xkeys: [req.document.uuid],
        binary: buffer.subarray(start, end + 1),
      };
    },
  },
  {
    op: 'get',
    view: '/@@download/:field',
    permission: 'View',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const field = req.document.json[req.params.field];
      const uuid = field.uuid;

      // Check if current etag
      if (checkETag(req, uuid)) {
        return {
          status: 304,
        };
      }

      // Fetch file
      const buffer = await readFile(uuid, trx);
      return {
        headers: {
          'content-type': field['content-type'],
          'content-disposition': `attachment; filename="${field.filename}"`,
          'Accept-Ranges': 'bytes',
        },
        etag: uuid,
        xkeys: [req.document.uuid],
        binary: buffer,
      };
    },
  },
  {
    op: 'get',
    view: '/@@images/:uuid.:ext',
    permission: 'View',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const uuid = req.params.uuid;

      // Check if current etag
      if (checkETag(req, uuid)) {
        return {
          status: 304,
        };
      }

      // Fetch file
      const buffer = await readFile(uuid, trx);
      return {
        headers: {
          'content-type': `image/${req.params.ext}`,
        },
        etag: uuid,
        xkeys: [req.document.uuid],
        binary: buffer,
      };
    },
  },
  {
    op: 'get',
    view: '/@@images/:field',
    permission: 'View',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const field = req.document.json[req.params.field];
      const uuid = field.uuid;

      // Check if current etag
      if (checkETag(req, uuid)) {
        return {
          status: 304,
        };
      }

      // Fetch file
      const buffer = await readFile(uuid, trx);
      return {
        headers: {
          'content-type': field['content-type'],
          'content-disposition': `attachment; filename="${field.filename}"`,
        },
        etag: uuid,
        xkeys: [req.document.uuid],
        binary: buffer,
      };
    },
  },
  {
    op: 'get',
    view: '/@@images/:field/:scale',
    permission: 'View',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const field = req.document.json[req.params.field];
      const uuid = field.scales[req.params.scale].uuid;

      // Check if current etag
      if (checkETag(req, uuid)) {
        return {
          status: 304,
        };
      }

      // Fetch file
      const buffer = await readFile(uuid, trx);
      return {
        headers: {
          'content-type': field['content-type'],
          'content-disposition': `attachment; filename="${field.filename}"`,
        },
        etag: uuid,
        xkeys: [req.document.uuid],
        binary: buffer,
      };
    },
  },
  {
    op: 'get',
    view: '@export',
    permission: 'View',
    client: 'exportContent',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const json = await req.document.toJson(req);
      return {
        headers: {
          'content-type': 'application/json',
          'content-disposition': `attachment; filename="${
            req.document.path === '/'
              ? '_root.json'
              : `${drop(req.document.path.split('/'), 1).join('.')}.json`
          }"`,
        },
        json: {
          uuid: json['UID'],
          type: json['@type'],
          workflow_state: json['review_state'],
          ...omit(json, [
            '@id',
            '@type',
            'UID',
            'review_state',
            'id',
            'is_folderish',
            'lock',
          ]),
        },
      };
    },
  },
  {
    op: 'get',
    view: '/ics_view',
    permission: 'View',
    client: 'getICS',
    cache: 'content',
    handler: async (req: Request, trx: Knex.Transaction) => {
      await req.document.fetchChildren(req, trx);
      await req.document.restrictChildren(req, trx);

      const ics = await req.document.toICS(req, trx);
      return {
        headers: {
          'content-type': 'text/calendar',
          'content-disposition': `attachment; filename="${req.document.id}.ics"`,
        },
        xkeys: [req.document.uuid],
        html: ics,
      };
    },
  },
  {
    op: 'get',
    view: '/rss_view',
    permission: 'View',
    client: 'getRSS',
    cache: 'content',
    handler: async (req: Request, trx: Knex.Transaction) => {
      await req.document.fetchChildren(req, trx);
      await req.document.restrictChildren(req, trx);

      const rss = await req.document.toRSS(req, trx);
      return {
        headers: {
          'content-type': 'application/rss+xml',
          'content-disposition': `attachment; filename="${req.document.id}.rss"`,
        },
        xkeys: [req.document.uuid],
        html: rss,
      };
    },
  },
  {
    op: 'get',
    view: '/markdown_view',
    permission: 'View',
    client: 'getMarkdown',
    cache: 'content',
    handler: async (req: Request, trx: Knex.Transaction) => {
      await req.document.fetchChildren(req, trx);
      await req.document.restrictChildren(req, trx);

      const markdown = await req.document.toMarkdown();
      return {
        headers: {
          'content-type': 'text/markdown',
          'content-disposition': `attachment; filename="${req.document.id}.md"`,
        },
        xkeys: [req.document.uuid],
        html: markdown,
      };
    },
  },
  {
    op: 'get',
    view: '',
    permission: 'View',
    client: 'getContent',
    cache: 'content',
    handler: async (req: Request, trx: Knex.Transaction) => {
      // Fetch data
      await req.document.fetchRelationLists(trx);
      await req.document.fetchChildren(req, trx);
      await req.document.restrictChildren(req, trx);

      // Check if calender accept
      if (req.headers?.accept === 'text/calendar') {
        const ics = await req.document.toICS(req, trx);
        return {
          headers: {
            'content-type': 'text/calendar',
            'content-disposition': `attachment; filename="${req.document.id}.ics"`,
          },
          xkeys: [req.document.uuid],
          html: ics,
        };
      }

      // Check if rss accept
      if (req.headers?.accept === 'application/rss+xml') {
        const rss = await req.document.toRSS(req, trx);
        return {
          headers: {
            'content-type': 'application/rss+xml',
            'content-disposition': `attachment; filename="${req.document.id}.rss"`,
          },
          xkeys: [req.document.uuid],
          html: rss,
        };
      }

      // Check if rss accept
      if (req.headers?.accept === 'text/markdown') {
        const markdown = await req.document.toMarkdown();
        return {
          headers: {
            'content-type': 'text/markdown',
            'content-disposition': `attachment; filename="${req.document.id}.md"`,
          },
          xkeys: [req.document.uuid],
          html: markdown,
        };
      }

      const json = await req.document.toJson(
        req,
        await getComponents(req, trx, req.query?.expand?.split(',') || []),
      );
      return {
        xkeys: [req.document.uuid],
        json: await handleBlockReferences(json, trx),
      };
    },
  },
  {
    op: 'post',
    view: '',
    permission: 'Add',
    client: 'addContent',
    cache: 'manage',
    middleware: express.json({
      limit: config.settings.requestLimit?.files || '10mb',
    }),
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Type = models.get('Type');
      const Document = models.get('Document');

      // Get content type date
      const type = await Type.fetchById(
        req.body['@type'],
        {
          related: '_workflow',
        },
        trx,
      );

      // Check if valid type
      if (!type) {
        throw new RequestException(400, {
          message: req.i18n('Type {type} not found.', {
            type: req.body['@type'],
          }),
        });
      }

      // Check required fields
      const required = type._schema.required;
      const requiredPosted = intersection(required, Object.keys(req.body));
      if (required.length !== requiredPosted.length) {
        throw new RequestException(400, {
          message: req.i18n('Required field(s) missing.'),
        });
      }

      // Set creation time
      const created = dayjs.utc().format();

      // Get child nodes
      await req.document.fetchChildren({}, trx);

      // Get json data
      const properties = type._schema.properties;

      // Set uuid
      const newUuid = req.body.uuid || uuid();

      // Set translation
      let translation_group = newUuid;
      if (req.body.translation_of) {
        if (req.body.translation_of.startsWith('/')) {
          const translation = await Document.fetchOne(
            { path: req.body.translation_of },
            {},
            trx,
          );
          if (translation) {
            translation_group = translation.uuid;
          }
        } else {
          translation_group = req.body.translation_of;
        }
      }

      // Remove fields which are not in the schema
      let json = {
        ...omit(pick(req.body, Object.keys(properties)), omitProperties),
      };

      // Handle files, images and relation lists
      json = await handleFiles(json, type, trx);
      json = await handleImages(json, type, trx);
      json = await handleRelationLists(json, req.type);

      // Create new document
      let document = Document.fromJson({
        uuid: newUuid,
        type: req.body['@type'],
        created,
        translation_group,
        language: req.body.language,
        modified: created,
        version: 0,
        position_in_parent:
          req.body.position_in_parent !== undefined
            ? req.body.position_in_parent
            : req.document._children.length,
        lock: { locked: false, stealable: true },
        workflow_state: type._workflow.json.initial_state,
        workflow_history: JSON.stringify(req.body.workflow_history || []),
        owner: req.user.id,
        json,
      }) as any;

      // Apply behaviors
      await document.applyBehaviors(trx);

      // Set id
      document.setId(
        req.body.id,
        req.document._children.map(
          (item: InstanceType<typeof Document>) => item.id,
        ),
      );

      // Set path
      document.path = `${req.document.path === '/' ? '' : req.document.path}/${
        document.id
      }`;

      // Trigger onBeforeAdd
      await events.trigger(
        'onBeforeAdd',
        document,
        req.user,
        trx,
        req.document, // Parent document
        json,
      );

      // Insert document in database
      document = await req.document.createRelatedAndFetch(
        '_children',
        document.$toDatabaseJson(),
        trx,
      );

      // Apply behaviors
      await document.applyBehaviors(trx);

      // Create initial version
      await document.createRelated(
        '_versions',
        {
          id: document.id,
          version: 0,
          created,
          actor: req.user.id,
          json: {
            ...document.json,
            changeNote: req.body.changeNote || 'Initial version',
          },
        },
        trx,
      );

      // Fetch type
      await document.fetchRelated('_type', trx);

      // Index new document
      await document.index(trx);

      // Fetch related lists
      await document.fetchRelationLists(trx);

      // Trigger onAfterAdd
      await events.trigger(
        'onAfterAdd',
        document,
        req.user,
        trx,
        req,
        req.document, // Parent document
        json,
      );

      // Send data back to client
      return {
        status: 201,
        json: await document.toJson(
          req,
          await getComponents(req, trx, req.query?.expand?.split(',') || []),
        ),
      };
    },
  },
  {
    op: 'patch',
    view: '',
    permission: 'Modify',
    client: 'updateContent',
    cache: 'alter',
    middleware: express.json({
      limit: config.settings.requestLimit?.files || '10mb',
    }),
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Document = models.get('Document');

      // Check if ordering request
      if (typeof req.body?.ordering !== 'undefined') {
        // Get children and reorder
        await req.document.fetchChildren({}, trx);
        await req.document.reorder(
          req.body.ordering.obj_id,
          req.body.ordering.delta,
          trx,
        );

        // Reindex children
        await req.document.reindexChildren(trx);

        // Send ok
        return {
          status: 204,
        };
      }

      // Check if locked
      const lock = req.document.lock;
      if (
        lock.locked &&
        !lockExpired(req.document) &&
        req.headers['lock-token'] !== lock.token
      ) {
        throw new RequestException(401, {
          error: {
            message: req.i18n(
              'You don’t have permission to save this document because it is locked by another user.',
            ),
            type: req.i18n('Document locked'),
          },
        });
      }

      // Get id and path variables of document, parent and siblings
      await req.document.fetchRelated('_parent', trx);
      await req.document._parent.fetchChildren({}, trx, false);
      const id = req.body.id || req.document.id;
      const path = req.document.path;

      // Get unique id if id has changed
      const newId =
        req.body.id && req.body.id !== req.document.id
          ? uniqueId(
              id,
              req.document._parent._children.map(
                (sibling: InstanceType<typeof Document>) => sibling.id,
              ),
            )
          : id;
      const newPath =
        path === '/'
          ? path
          : `${
              req.document._parent.path === '/' ? '' : req.document._parent.path
            }/${newId}`;

      // Handle file uploads
      let json = {
        ...req.document.json,
        ...omit(
          pick(req.body, Object.keys(req.type._schema.properties)),
          omitProperties,
        ),
      };
      json = await handleFiles(json, req.type, trx);
      json = await handleImages(json, req.type, trx);
      json = await handleRelationLists(json, req.type);

      // Create new version
      const modified = dayjs.utc().format();
      const version = req.document.version + 1;
      await req.document.createRelated(
        '_versions',
        {
          document: req.document.uuid,
          id: newId,
          created: modified,
          actor: req.user.id,
          version,
          json: {
            ...json,
            changeNote: req.body.changeNote,
          },
        },
        trx,
      );

      // If path has changed change path of document and children
      if (path !== newPath) {
        await Document.replacePath(path, newPath, trx);
      }

      // Trigger onBeforeAdd
      await events.trigger('onBeforeModify', req.document, req.user, trx, {
        ...json,
        id: newId,
        path: newPath,
      });

      // Save document with new values
      await req.document.updateAndFetch(
        {
          id: newId,
          path: newPath,
          position_in_parent:
            req.body.position_in_parent !== undefined
              ? req.body.position_in_parent
              : req.document.position_in_parent,
          language:
            req.body.language !== undefined
              ? req.body.language
              : req.document.language,
          version,
          modified,
          json,
          lock: {
            locked: false,
            stealable: true,
          },
        },
        trx,
      );

      // Reindex document
      await req.document.reindex(trx);

      // Get document json
      const documentJson = await req.document.toJson(
        req,
        await getComponents(req, trx, req.query?.expand?.split(',') || []),
      );

      // Trigger onAfterModified
      await events.trigger('onAfterModified', req.document, req.user, trx, req);

      // Send ok
      return {
        status: 204,
      };
    },
  },
  {
    op: 'delete',
    view: '',
    permission: 'Modify',
    client: 'deleteContent',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Document = models.get('Document');

      // Get parent
      await req.document.fetchRelated('_parent', trx);
      const parent = req.document._parent;

      // Trigger onBeforeDelete
      await events.trigger(
        'onBeforeDelete',
        req.document,
        req.user,
        trx,
        req.document._parent,
      );
      // Set deletion time
      const deleted = dayjs.utc().format();

      // If recycle bin enabled move to recycle bin else delete permanently
      if (config.settings.recyclebin) {
        // Get document and children to be deleted
        const documents = await Document.fetchAll(
          { path: ['~', `^${req.document.path}`] },
          {},
          trx,
        );

        // Move documents to recycle bin
        await mapAsync(documents.models, async (document: any) => {
          await document.update(
            {
              deleted: true,
              workflow_history: JSON.stringify([
                ...document.workflow_history,
                {
                  time: deleted,
                  type: 'delete',
                  actor: req.user.id,
                },
              ]),
            },
            trx,
          );
        });
      } else {
        // Delete files and images of document and versions
        await req.document.deleteFilesAndImages(trx);

        // Remove document (versions will be cascaded)
        await req.document.delete(trx);
      }

      // Fix order in parent
      await parent.fetchChildren({}, trx, false);
      await parent.fixOrder(trx);

      // Reindex children
      await parent.reindexChildren(trx);

      // Reindex parent
      await parent.reindex(trx);

      // Trigger onAfterDelete
      await events.trigger(
        'onAfterDelete',
        req.document,
        req.user,
        trx,
        req.document._parent,
      );

      // Return deleted
      return {
        status: 204,
      };
    },
  },
];
