/**
 * Recycle bin routes.
 * @module routes/recyclebin/recyclebin
 */

// Type imports
import type { DeleteInfo, Request } from '../../types';
import type { Knex } from 'knex';

// Internal imports
import config from '../../helpers/config/config';
import { RequestException } from '../../helpers/error/error';
import { getRootUrl, getUrl } from '../../helpers/url/url';
import { mapAsync, uniqueId } from '../../helpers/utils/utils';
import { apiLimiter } from '../../helpers/limiter/limiter';
import models from '../../models';

export default [
  {
    op: 'get',
    view: '/@recyclebin/:id',
    permission: 'View',
    client: 'getRecyclebinItem',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Document = models.get('Document');
      const document = await Document.fetchOne(
        { uuid: req.params.id, deleted: true },
        {},
        trx,
      );

      // If document not found throw not found error
      if (!document) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }

      // Check permission
      const deleteInfo: DeleteInfo = document.workflow_history.at(-1);
      if (
        !req.permissions.includes('Manage Site') &&
        req.user.id !== deleteInfo.actor
      ) {
        throw new RequestException(403, {
          error: req.i18n('You are not authorized to access this resource.'),
        });
      }

      // Return json
      await document.fetchChildren({}, trx, false);
      return {
        json: await document.toRecyclebinJson(req),
        keys: [req.params.id],
      };
    },
  },
  {
    op: 'get',
    view: '/@recyclebin',
    permission: 'View',
    client: 'getRecyclebinItems',
    middleware: apiLimiter,
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      // Get all deleted documents
      const Document = models.get('Document');
      const documents = await Document.fetchAll({ deleted: true }, {}, trx);

      // Filter documents based on permission
      documents.filter((document: any) => {
        const deleteInfo: DeleteInfo = document.workflow_history.at(-1);
        return (
          req.permissions.includes('Manage Site') ||
          req.user.id === deleteInfo.actor
        );
      });

      // Return json
      return {
        json: {
          '@id': `${getUrl(req)}/@recyclebin`,
          items: await documents.toRecyclebinJson(req),
        },
        keys: documents.map((document: any) => document.uuid),
      };
    },
  },
  {
    op: 'post',
    view: '/@recyclebin/:id/restore',
    permission: 'View',
    client: 'restoreRecyclebinItem',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Document = models.get('Document');
      const document = await Document.fetchOne(
        { uuid: req.params.id, deleted: true },
        {},
        trx,
      );

      // If document not found throw not found error
      if (!document) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }

      // Check permission
      const deleteInfo: DeleteInfo = document.workflow_history.at(-1);
      if (
        !req.permissions.includes('Manage Site') &&
        req.user.id !== deleteInfo.actor
      ) {
        throw new RequestException(403, {
          error: req.i18n('You are not authorized to access this resource.'),
        });
      }

      // Target path to restore document to
      const targetPath = req.body?.target_path;

      // Fetch parent document
      await document.fetchRelated('_parent', trx);
      let parent = document._parent;

      // Check if target path provided
      if (targetPath) {
        // Fetch target parent document
        parent = await Document.fetchOne({ path: targetPath }, {}, trx);

        // If parent not found throw not found error
        if (!parent) {
          throw new RequestException(404, {
            error: req.i18n('Target path not found.'),
          });
        }
      }

      await parent.fetchChildren({}, trx, false);
      const childIds = parent._children.map(
        (child: InstanceType<typeof Document>) => child.id,
      );

      // Generate new path for document
      const path = parent.path;
      const newId = uniqueId(document.id, childIds);
      const newPath = `${path}${path === '/' ? '' : '/'}${newId}`;

      // Replace path of moved object and children
      await Document.replacePath(document.path, newPath, trx);

      // Save document in new location
      await document.updateAndFetch(
        {
          id: newId,
          path: newPath,
          deleted: false,
        },
        trx,
      );

      // Fix order of children
      await parent.fetchChildren({}, trx, false);
      await parent.fixOrder(trx);

      // Reindex parent and siblings
      await parent.reindex(trx);
      await parent.reindexChildren(trx);

      // Send restored
      return {
        json: {
          message: req.i18n('Document {document} restored successfully', {
            document: document.getTitle(),
          }),
          restored_item: {
            '@id': `${getRootUrl(req)}${document.path}`,
            '@type': document.type,
            id: document.id,
            title: document.getTitle(),
          },
          status: 'success',
        },
      };
    },
  },
  {
    op: 'delete',
    view: '/@recyclebin/:id',
    permission: 'View',
    client: 'purgeRecyclebinItem',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Document = models.get('Document');
      const document = await Document.fetchOne(
        { uuid: req.params.id, deleted: true },
        {},
        trx,
      );

      // If document not found throw not found error
      if (!document) {
        throw new RequestException(404, { error: req.i18n('Not found.') });
      }

      // Check permission
      const deleteInfo: DeleteInfo = document.workflow_history.at(-1);
      if (
        !req.permissions.includes('Manage Site') &&
        req.user.id !== deleteInfo.actor
      ) {
        throw new RequestException(403, {
          error: req.i18n('You are not authorized to access this resource.'),
        });
      }

      // Delete files and images of document and versions
      await document.deleteFilesAndImages(trx);

      // Remove document (versions will be cascaded)
      await document.delete(trx);

      return {
        status: 204,
      };
    },
  },
  {
    op: 'delete',
    view: '/@recyclebin',
    permission: 'View',
    client: 'purgeRecyclebinItems',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      // Get all deleted documents
      const Document = models.get('Document');
      const documents = await Document.fetchAll({ deleted: true }, {}, trx);

      // Filter documents based on permission
      documents.filter((document: any) => {
        const deleteInfo: DeleteInfo = document.workflow_history.at(-1);
        return (
          req.permissions.includes('Manage Site') ||
          req.user.id === deleteInfo.actor
        );
      });

      // Delete documents
      mapAsync(documents, async (document: any) => {
        // Delete files and images of document and versions
        await document.deleteFilesAndImages(trx);

        // Remove document (versions will be cascaded)
        await document.delete(trx);
      });

      return {
        status: 204,
      };
    },
  },
];
