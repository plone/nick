/**
 * Replace routes.
 * @module routes/replace/replace
 */

// Type imports
import type { Request } from '../../types';
import type { Knex } from 'knex';

// External imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// Internal imports
import blocks from '../../blocks';
import events from '../../events';
import { RequestException } from '../../helpers/error/error';
import { queryparamToQuery } from '../../helpers/query/query';
import { getUrl } from '../../helpers/url/url';
import { mapAsync, uniqueId } from '../../helpers/utils/utils';
import models from '../../models';

dayjs.extend(utc);

export default [
  {
    op: 'post',
    view: '@replace',
    permission: 'Modify',
    client: 'replace',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      // Check pattern
      if ((req.body?.pattern || '').length === 0) {
        throw new RequestException(400, {
          error: req.i18n('Pattern must be at least 1 character long.'),
        });
      }

      // Create
      const pattern = new RegExp(req.body.pattern, 'g');

      // Check replacement
      const replacement =
        typeof req.body?.replacement === 'string'
          ? req.body?.replacement
          : undefined;
      if (replacement === undefined) {
        throw new RequestException(400, {
          error: req.i18n('Replacement must be provided.'),
        });
      }

      const Document = models.get('Document');
      const Catalog = models.get('Catalog');

      // Get all documents traversed down and the user has permission on
      const query = await queryparamToQuery({}, req.document.path, req, trx);
      const items = await Catalog.fetchAllRestricted(
        query[0],
        query[1],
        trx,
        req,
      );

      // Array with changed objects
      const changedDocuments: any = [];

      // Loop over catalog results
      await mapAsync(items.models, async (item: any) => {
        // Get document including the type
        const document = await Document.fetchById(
          item.UID,
          { related: '_type' },
          trx,
        );

        // Get properties of type
        const properties = document._type._schema.properties;

        // Get a list of field to check
        const fields = Object.keys(properties).filter(
          (property) =>
            properties[property].type === 'string' &&
            !['id', 'changeNote'].includes(property) &&
            properties[property].widget !== 'datetime' &&
            properties[property].factory !== 'Choice',
        );

        // Changed values
        const newJson: { [key: string]: any } = { ...document.json };
        const changedFields: any[] = [];

        // Loop over fields
        fields.map((field: string) => {
          const newValue = document.json?.[field]?.replaceAll(
            pattern,
            replacement,
          );
          if (newValue !== document.json?.[field]) {
            newJson[field] = newValue;
            changedFields.push(field);
          }
        });

        // Check new id
        let newId = document.id.replaceAll(pattern, replacement);
        let newPath = document.path;
        if (newId !== document.id) {
          changedFields.push('id');
          await document.fetchRelated('_parent._children', trx);
          newId = uniqueId(
            newId,
            document._parent._children.map(
              (sibling: InstanceType<typeof Document>) => sibling.id,
            ),
          );

          // Get new path
          newPath =
            document.path === '/'
              ? document.path
              : `${
                  document._parent.path === '/' ? '' : document._parent.path
                }/${newId}`;
        }

        // Check blocks
        const curBlocks = document.json?.blocks || {};
        let blocksChanged: boolean = false;
        Object.keys(curBlocks).map((blockId) => {
          const block: any = blocks.get(curBlocks[blockId]['@type']);
          const newValue = block.replace(
            curBlocks[blockId],
            pattern,
            replacement,
          );

          // Check if new value
          if (newValue !== false) {
            curBlocks[blockId].value = newValue;
            blocksChanged = true;
          }
        });

        // Check if blocks changed
        if (blocksChanged) {
          changedFields.push('blocks');
          newJson['blocks'] = curBlocks;
        }

        // Check if any field changed
        if (changedFields.length > 0) {
          // Add to result
          changedDocuments.push({
            title: document.json.title,
            path: document.path,
            fields: changedFields,
          });

          // Create new version
          const modified = dayjs.utc().format();
          const version = document.version + 1;
          await document.createRelated(
            '_versions',
            {
              document: document.uuid,
              id: newId,
              created: modified,
              actor: req.user.id,
              version,
              json: {
                ...newJson,
                changeNote: req.i18n(
                  'Replaced text from {pattern} to {replacement}.',
                  { pattern: req.body.pattern, replacement },
                ),
              },
            },
            trx,
          );

          // If path has changed change path of document and children
          if (document.path !== newPath) {
            await Document.replacePath(document.path, newPath, trx);
          }

          // Trigger onBeforeModify
          await events.trigger('onBeforeModify', document, req.user, trx, {
            ...newJson,
            id: newId,
            path: newPath,
          });

          // Save document with new values
          await document.updateAndFetch(
            {
              id: newId,
              path: newPath,
              version,
              modified,
              json: newJson,
            },
            trx,
          );

          // Reindex document
          await document.reindex(trx);

          // Trigger onAfterModified
          await events.trigger('onAfterModified', document, req.user, trx, req);
        }
      });

      // Send ok
      return {
        status: 200,
        json: {
          '@id': `${getUrl(req)}/@replace`,
          changes: changedDocuments,
        },
      };
    },
  },
];
