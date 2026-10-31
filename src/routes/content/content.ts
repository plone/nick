/**
 * Content routes.
 * @module routes/content/content
 */

// Type imports
import type { Request } from '../../types';
import type { Knex } from 'knex';

// External imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { difference, drop } from 'es-toolkit/array';
import { isEqual, isObject } from 'es-toolkit/compat';
import { omit, pick } from 'es-toolkit/object';
import { v4 as uuid } from 'uuid';

// Internal imports
import events from '../../events';
import { checkETag } from '../../helpers/cache/cache';
import config from '../../helpers/config/config';
import {
  fetchParentSummary,
  getComponents,
  handleBlockReferences,
  handleBlocks,
  handleFiles,
  handleImages,
  handleRelationLists,
  parentSummary,
} from '../../helpers/content/content';
import { RequestException } from '../../helpers/error/error';
import { readFile } from '../../helpers/fs/fs';
import { expandable } from '../../helpers/querystring/querystring';
import {
  contentBodyParser,
  resolveMultipartBody,
} from '../../helpers/multipart/multipart';
import { getBatching, getBatchParams } from '../../helpers/query/query';
import { getRootUrl, getUrl } from '../../helpers/url/url';
import {
  getFactoryFields,
  normalizeFields,
  validateFields,
} from '../../helpers/schema/schema';
import {
  bytesToNumber,
  isValidId,
  likePrefix,
  mapAsync,
  parseRange,
  pasteId,
  uniqueId,
} from '../../helpers/utils/utils';
import models from '../../models';

dayjs.extend(utc);

const omitProperties = ['@type', 'id', 'changeNote', 'language'];

// Content types which are safe to show inline in the browser, other types
// (like html or svg) could run scripts on the origin of the api
const inlineContentTypes = [
  'application/pdf',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'image/avif',
  'image/bmp',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
  'video/mp4',
  'video/ogg',
  'video/quicktime',
  'video/webm',
];

/**
 * Check if a content type is safe to show inline.
 * @param {string} contentType The content type.
 * @returns {boolean} True if safe to show inline.
 */
function isInlineContentType(contentType: string): boolean {
  return inlineContentTypes.includes(
    (contentType || '').split(';')[0].trim().toLowerCase(),
  );
}

/**
 * Get the content-disposition header value. Uploaded files are only shown
 * inline when their content type is safe to show inline.
 * @param {Request} req The request object.
 * @param {string} filename The filename to disposition.
 * @param {string} contentType Content type of an uploaded file.
 * @returns {string} The content-disposition header value.
 */
function getDisposition(
  req: Request,
  filename: string,
  contentType?: string,
): string {
  const type =
    req.query?.disposition === 'inline' &&
    (contentType === undefined || isInlineContentType(contentType))
      ? 'inline'
      : 'attachment';
  return `${type}; filename="${filename}"`;
}

/**
 * Get the response for a part of a file: 206 with the range, or 200 when it
 * is the whole file.
 * @param {Request} req The request object.
 * @param {Object} field The file field.
 * @param {string} uuid Uuid of the file.
 * @param {Buffer} buffer Contents of the file.
 * @param {number} start First byte.
 * @param {number} end Last byte.
 * @returns {Object} The response.
 */
function fileRange(
  req: Request,
  field: any,
  uuid: string,
  buffer: Buffer,
  start: number,
  end: number,
): any {
  const size = buffer.length;
  const whole = start === 0 && end >= size - 1;
  return {
    headers: {
      'content-type': field['content-type'],
      'content-disposition': getDisposition(
        req,
        field.filename,
        field['content-type'],
      ),
      'content-length': whole ? size : end - start + 1,
      ...(whole ? {} : { 'content-range': `bytes ${start}-${end}/${size}` }),
      'Accept-Ranges': 'bytes',
    },
    status: whole ? 200 : 206,
    etag: uuid,
    xkeys: [req.document.uuid],
    binary: whole ? buffer : buffer.subarray(start, end + 1),
  };
}

/**
 * Get the response for a range outside of a file.
 * @param {number} size Size of the file.
 * @returns {Object} The response.
 */
function rangeNotSatisfiable(size: number): any {
  return {
    headers: {
      'content-range': `bytes */${size}`,
      'Accept-Ranges': 'bytes',
    },
    status: 416,
  };
}

/**
 * Find an image (or one of its scales) in the image fields of the given data.
 * @param {Object} schema Schema of the data.
 * @param {Object} data Data with the image fields.
 * @param {string} uuid Uuid of the image file.
 * @returns {Object|undefined} The image field data if found.
 */
function findImage(schema: any, data: any, uuid: string): any {
  const field = getFactoryFields(schema, 'Image').find(
    (field: string) =>
      data?.[field]?.uuid === uuid ||
      Object.values(data?.[field]?.scales || {}).some(
        (scale: any) => scale?.uuid === uuid,
      ),
  );
  return field ? data[field] : undefined;
}

/**
 * Find an image file of the current document, one of its versions or the
 * control panels (e.g. the site logo).
 * @param {Request} req The request object.
 * @param {string} uuid Uuid of the image file.
 * @param {Knex.Transaction} trx Transaction object.
 * @returns {Promise<Object|undefined>} The image field data if found.
 */
async function findImageOfDocument(
  req: Request,
  uuid: string,
  trx: Knex.Transaction,
): Promise<any> {
  const Controlpanel = models.get('Controlpanel');
  const schema = req.type._schema;

  // Image of the document
  const image = findImage(schema, req.document.json, uuid);
  if (image) {
    return image;
  }

  // Image of one of the versions of the document
  await req.document.fetchRelated('_versions', trx);
  for (const version of req.document._versions || []) {
    const versionImage = findImage(schema, version.json, uuid);
    if (versionImage) {
      return versionImage;
    }
  }

  // Image of a control panel
  const controlpanels = await Controlpanel.fetchAll({}, {}, trx);
  for (const controlpanel of controlpanels.models) {
    const controlpanelImage = findImage(
      controlpanel.schema,
      controlpanel.data,
      uuid,
    );
    if (controlpanelImage) {
      return controlpanelImage;
    }
  }
  return undefined;
}

export default [
  {
    op: 'post',
    view: '/@move',
    permission: 'Add',
    client: 'moveContent',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Document = models.get('Document');

      // Lock the target to serialize changes of its children
      await req.document.lockForUpdate(trx);

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
        // Get item to be moved, skip if not found or not viewable
        const document = await Document.fetchOne({ path: source }, {}, trx);
        const permissions = document
          ? await document.fetchUserPermissions(req.user, trx)
          : [];
        if (!permissions.includes('View')) {
          return;
        }

        // Moving removes the item from its folder, like deleting it
        if (!permissions.includes('Modify')) {
          throw new RequestException(req.user.id === 'anonymous' ? 401 : 403, {
            message: req.i18n(
              'You are not authorized to access this resource.',
            ),
          });
        }

        // Check if locked
        if (document.isLockedFor(req.user.id, req.headers['lock-token'])) {
          throw new RequestException(423, {
            error: {
              message: req.i18n('Resource is locked.'),
              type: req.i18n('Document locked'),
            },
          });
        }

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
          const newId = pasteId(document.id, childIds);
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

      // Lock the target to serialize changes of its children
      await req.document.lockForUpdate(trx);

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
        // Get item to be copied, skip if not found or not viewable
        const document = await Document.fetchOne({ path: source }, {}, trx);
        if (
          !document ||
          !(await document.fetchUserPermissions(req.user, trx)).includes('View')
        ) {
          return;
        }

        // Calculate new id and path
        const path = req.document.path;
        const newId = pasteId(document.id, childIds);
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
    permission: 'View History',
    client: 'getHistoryVersion',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      // A version is a non-negative integer, there is no other version
      if (!/^[0-9]+$/.test(req.params.version)) {
        throw new RequestException(404, {
          message: req.i18n('Version not found.'),
        });
      }
      await req.document.fetchChildren({}, trx);
      const version = parseInt(req.params.version, 10);
      await req.document.fetchVersion(version, trx);
      if (!req.document._version) {
        throw new RequestException(404, {
          message: req.i18n('Version not found.'),
        });
      }
      await req.document.fetchRelationLists(trx, req);
      return {
        json: await handleBlockReferences(
          {
            ...(await req.document.toJson(
              req,
              await getComponents(req, trx, expandable(req.query?.expand)),
            )),
            version,
          },
          trx,
        ),
        xkeys: [req.document.uuid],
      };
    },
  },
  {
    op: 'get',
    view: '/@@videos/:field',
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

      // Get chunk size
      const chunkSize = bytesToNumber(
        config.settings.requestLimit?.chunk || '1mb',
      );
      const size = buffer.length;

      // Check range, without a range or end the video is streamed in chunks
      const range = parseRange(req.headers.range, size);
      if (range === 'unsatisfiable') {
        return rangeNotSatisfiable(size);
      }
      const start = range?.start ?? 0;
      const end = range?.end ?? Math.min(start + chunkSize - 1, size - 1);

      return fileRange(req, field, uuid, buffer, start, end);
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
      const size = buffer.length;

      // Check range, without a range the whole file is served
      const range = parseRange(req.headers.range, size);
      if (range === 'unsatisfiable') {
        return rangeNotSatisfiable(size);
      }
      return fileRange(
        req,
        field,
        uuid,
        buffer,
        range?.start ?? 0,
        range?.end ?? size - 1,
      );
    },
  },
  {
    op: 'get',
    view: '/@@images/:uuid.:ext',
    permission: 'View',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const uuid = req.params.uuid;

      // Only serve images of this document, so the View permission on the
      // document applies to the image
      const image = await findImageOfDocument(req, uuid, trx);
      if (!image) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }

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
          'content-type': image['content-type'],
          // Other types are downloaded, the filename is encoded because a
          // header can't contain non-ascii characters
          ...(isInlineContentType(image['content-type'])
            ? {}
            : {
                'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(
                  image.filename || '',
                )}`,
              }),
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
          'content-disposition': getDisposition(
            req,
            field.filename,
            field['content-type'],
          ),
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
          'content-disposition': getDisposition(
            req,
            field.filename,
            field['content-type'],
          ),
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
          'content-disposition': getDisposition(
            req,
            req.document.path === '/'
              ? '_root.json'
              : `${drop(req.document.path.split('/'), 1).join('.')}.json`,
          ),
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
          'content-disposition': getDisposition(req, `${req.document.id}.ics`),
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
          'content-disposition': getDisposition(req, `${req.document.id}.rss`),
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
          'content-disposition': getDisposition(req, `${req.document.id}.md`),
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
      await req.document.fetchRelationLists(trx, req);
      await req.document.fetchChildren(req, trx);
      await req.document.restrictChildren(req, trx);

      // Check if calender accept
      if (req.headers?.accept === 'text/calendar') {
        const ics = await req.document.toICS(req, trx);
        return {
          headers: {
            'content-type': 'text/calendar',
            'content-disposition': getDisposition(
              req,
              `${req.document.id}.ics`,
            ),
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
            'content-disposition': getDisposition(
              req,
              `${req.document.id}.rss`,
            ),
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
            'content-disposition': getDisposition(req, `${req.document.id}.md`),
          },
          xkeys: [req.document.uuid],
          html: markdown,
        };
      }

      // Batch the items
      const { start, size } = getBatchParams(
        req.query?.b_start,
        req.query?.b_size,
      );
      const total = req.document._restrictedChildren.length;
      req.document._restrictedChildren = req.document._restrictedChildren.slice(
        start,
        start + size,
      );
      const fullobjects = ['1', 'true', 'True'].includes(
        req.query?.fullobjects,
      );

      const json: any = await req.document.toJson(
        req,
        await getComponents(req, trx, expandable(req.query?.expand)),
      );
      const links = getBatching(
        getUrl(req),
        req.query || {},
        total,
        start,
        size,
      );
      return {
        xkeys: [req.document.uuid],
        json: await handleBlockReferences(
          {
            ...json,
            ...(await fetchParentSummary(req, req.document, trx)),
            items: json.items.map((item: any) => ({
              ...item,
              description: item.description || '',
              ...(fullobjects
                ? { parent: parentSummary(req, req.document) }
                : {}),
            })),
            items_total: total,
            ...(links ? { batching: links } : {}),
            version: 'current',
          },
          trx,
        ),
      };
    },
  },
  {
    op: 'post',
    view: '',
    permission: 'Add',
    client: 'addContent',
    cache: 'manage',
    bodyParser: contentBodyParser,
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Type = models.get('Type');
      const Document = models.get('Document');

      // Resolve multipart/form-data bodies (file/image parts) into plain JSON
      req.body = resolveMultipartBody(req);

      // Lock the parent to serialize the creation of its children
      await req.document.lockForUpdate(trx);

      // Check if a type is specified
      if (typeof req.body?.['@type'] !== 'string') {
        throw new RequestException(400, {
          message: req.i18n("Property '@type' is required."),
        });
      }

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
        throw new RequestException(403, {
          message: req.i18n(
            "Invalid '@type' parameter. No content type with the name “{type}” found.",
            {
              type: req.body['@type'],
            },
          ),
        });
      }

      // Check required fields and the values of the fields
      const errors = [
        ...difference(type._schema.required || [], Object.keys(req.body)).map(
          (field: string) => ({
            field,
            message: req.i18n('Required input is missing.'),
            error: 'ValidationError',
          }),
        ),
        ...validateFields(req.body, type._schema, req.i18n),
      ];
      if (errors.length > 0) {
        throw new RequestException(400, {
          message: JSON.stringify(errors),
        });
      }

      // Check the id if specified
      await req.document.fetchChildren({}, trx);
      if (typeof req.body.id !== 'undefined') {
        if (!isValidId(req.body.id)) {
          throw new RequestException(400, {
            message: req.i18n('The id “{id}” is invalid.', {
              id: `${req.body.id}`,
            }),
          });
        }
        if (
          req.document._children.some(
            (child: InstanceType<typeof Document>) => child.id === req.body.id,
          )
        ) {
          throw new RequestException(400, {
            message: req.i18n(
              'The id “{id}” is invalid - it is already in use.',
              {
                id: req.body.id,
              },
            ),
          });
        }
      }

      // Set creation time
      const created = dayjs.utc().format();

      // Get json data
      const properties = type._schema.properties;

      // Only site managers may choose the uuid, as `UID` (like
      // plone.restapi) or `uuid`
      const requestedUuid = req.body.UID ?? req.body.uuid;
      if (requestedUuid && !req.permissions.includes('Manage Site')) {
        throw new RequestException(403, {
          message: req.i18n('You are not authorized to set the uuid.'),
        });
      }
      if (requestedUuid) {
        if (
          typeof requestedUuid !== 'string' ||
          !/^[0-9a-f]{8}-?([0-9a-f]{4}-?){3}[0-9a-f]{12}$/i.test(requestedUuid)
        ) {
          throw new RequestException(400, {
            message: req.i18n('The uuid is invalid.'),
          });
        }
        if (await Document.fetchById(requestedUuid, {}, trx)) {
          throw new RequestException(400, {
            message: req.i18n('The uuid is already in use.'),
          });
        }
      }

      // Set uuid
      const newUuid = requestedUuid || uuid();

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
      let json = normalizeFields(
        omit(pick(req.body, Object.keys(properties)), omitProperties),
        type._schema,
      );

      // Handle files, images and relation lists
      const schema = type._schema;
      json = await handleBlocks(json);
      json = await handleFiles(json, schema, trx);
      json = await handleImages(json, schema, trx);
      json = await handleRelationLists(json, schema);

      // Create new document
      let document = Document.fromJson({
        uuid: newUuid,
        type: req.body['@type'],
        created,
        translation_group,
        // The language of the container, like plone.app.multilingual
        language:
          req.body.language !== undefined
            ? req.body.language
            : req.document.language,
        modified: created,
        version: 0,
        position_in_parent:
          req.body.position_in_parent !== undefined
            ? req.body.position_in_parent
            : req.document._children.length,
        lock: { locked: false, stealable: true },
        workflow_state: type._workflow.json.initial_state,
        // The creation is the first entry of the history, like in Plone
        workflow_history: JSON.stringify([
          {
            time: created,
            actor: req.user.id,
            action: null,
            review_state: type._workflow.json.initial_state,
            state_title:
              type._workflow.json.states?.[type._workflow.json.initial_state]
                ?.title,
          },
        ]),
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

      // Set the variables of the workflow
      await document.initWorkflowStatus(req.user, trx, req);

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
      await document.fetchRelationLists(trx, req);

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
      const result: any = await document.toJson(
        req,
        await getComponents(req, trx, expandable(req.query?.expand)),
      );
      return {
        status: 201,
        headers: {
          Location: result['@id'],
        },
        json: {
          ...result,
          parent: parentSummary(req, req.document),
        },
      };
    },
  },
  {
    op: 'patch',
    view: '',
    permission: 'Modify',
    client: 'updateContent',
    cache: 'alter',
    bodyParser: contentBodyParser,
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Document = models.get('Document');

      // Resolve multipart/form-data bodies (file/image parts) into plain JSON
      req.body = resolveMultipartBody(req);

      // Lock the document to serialize concurrent changes
      await req.document.lockForUpdate(trx);

      // Check if ordering or sorting request
      const { ordering, sort } = req.body || {};
      if (typeof ordering !== 'undefined' || typeof sort !== 'undefined') {
        await req.document.fetchChildren({}, trx);

        // Reorder an item, within the subset if specified
        if (isObject(ordering)) {
          const { obj_id, delta, subset_ids } = ordering as any;
          if (Array.isArray(subset_ids)) {
            const ids = req.document._children
              .map((child: InstanceType<typeof Document>) => child.id)
              .filter((childId: string) => subset_ids.includes(childId));
            if (!isEqual(ids, subset_ids)) {
              throw new RequestException(400, {
                message: req.i18n('Client/server ordering mismatch.'),
              });
            }
          }

          // The item has to be one of the (subset of the) children and the
          // delta `top`, `bottom` or an integer
          const ids = (
            Array.isArray(subset_ids)
              ? subset_ids
              : req.document._children.map(
                  (child: InstanceType<typeof Document>) => child.id,
                )
          ) as string[];
          if (typeof obj_id !== 'string' || !ids.includes(obj_id)) {
            throw new RequestException(400, {
              message: req.i18n('The item “{id}” is not found.', {
                id: `${obj_id}`,
              }),
            });
          }
          if (!(
            delta === 'top' ||
            delta === 'bottom' ||
            Number.isInteger(delta) ||
            (typeof delta === 'string' && /^[-+]?[0-9]+$/.test(delta))
          )) {
            throw new RequestException(400, {
              message: req.i18n(
                'The delta has to be top, bottom or an integer.',
              ),
            });
          }
          await req.document.reorder(
            obj_id,
            delta,
            trx,
            Array.isArray(subset_ids) ? subset_ids : undefined,
          );
        }

        // Sort all items
        if (isObject(sort) && typeof (sort as any).on === 'string') {
          await req.document.sortChildren(
            (sort as any).on,
            (sort as any).order,
            trx,
          );
        }

        // Reindex children
        await req.document.reindexChildren(trx);

        // Send ok if nothing else to update
        if (Object.keys(omit(req.body, ['ordering', 'sort'])).length === 0) {
          return {
            status: 204,
          };
        }
      }

      // Check if locked
      if (req.document.isLockedFor(req.user.id, req.headers['lock-token'])) {
        throw new RequestException(403, {
          error: {
            message: req.i18n('Resource is locked.'),
            type: req.i18n('Document locked'),
          },
        });
      }

      // Check the values of the fields and the id
      const errors = validateFields(req.body || {}, req.type._schema, req.i18n);
      if (errors.length > 0) {
        throw new RequestException(400, {
          message: JSON.stringify(errors),
        });
      }
      if (
        typeof req.body.id !== 'undefined' &&
        req.body.id !== req.document.id &&
        !isValidId(req.body.id)
      ) {
        throw new RequestException(400, {
          message: req.i18n('The id “{id}” is invalid.', {
            id: `${req.body.id}`,
          }),
        });
      }

      // Get id and path variables of document, parent and siblings
      await req.document.fetchRelated('_parent', trx);
      if (req.document._parent) {
        await req.document._parent.fetchChildren({}, trx, false);
      }
      const path = req.document.path;
      const id =
        path === '/' ? req.document.id : req.body.id || req.document.id;

      // Get unique id if id has changed
      const newId =
        req.body.id && req.body.id !== req.document.id && path !== '/'
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
        ...normalizeFields(
          omit(
            pick(req.body, Object.keys(req.type._schema.properties)),
            omitProperties,
          ),
          req.type._schema,
        ),
      };
      const schema = req.type._schema;
      json = await handleBlocks(json);
      json = await handleFiles(json, schema, trx);
      json = await handleImages(json, schema, trx);
      json = await handleRelationLists(json, schema);
      json = { ...req.document.json, ...json };

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
        },
        trx,
      );

      // Reindex document
      await req.document.reindex(trx);

      // Trigger onAfterModified
      await events.trigger('onAfterModified', req.document, req.user, trx, req);

      // Return the content if asked for
      if (req.headers.prefer === 'return=representation') {
        await req.document.fetchRelationLists(trx, req);
        await req.document.fetchChildren(req, trx);
        await req.document.restrictChildren(req, trx);
        return {
          status: 200,
          json: {
            ...(await req.document.toJson(
              req,
              await getComponents(req, trx, []),
            )),
            ...(await fetchParentSummary(req, req.document, trx)),
          },
        };
      }

      // Send ok
      return {
        status: 204,
      };
    },
  },
  {
    op: 'delete',
    view: '',
    permission: 'Delete',
    client: 'deleteContent',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Document = models.get('Document');

      // Get parent and lock parent before the document, as all changes of
      // the children of a parent lock the parent first
      await req.document.fetchRelated('_parent', trx);
      const parent = req.document._parent;
      await parent?.lockForUpdate(trx);
      await req.document.lockForUpdate(trx);

      // Check if locked
      if (req.document.isLockedFor(req.user.id, req.headers['lock-token'])) {
        throw new RequestException(423, {
          error: {
            message: req.i18n('Object “{id}” is locked.', {
              id: req.document.id,
            }),
            type: req.i18n('Document locked'),
          },
        });
      }

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
          {
            path: [
              'raw',
              '(path = ? OR path LIKE ?)',
              [req.document.path, likePrefix(`${req.document.path}/`)],
            ],
          },
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
