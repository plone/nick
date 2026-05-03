/**
 * Push events
 * @module push/push
 */

// Internal imports
import { getComponents } from '../../helpers/content/content';
import { sendPush } from '../../helpers/push/push';
import models from '../../models';

export const push = {
  onAfterMove: async (document: any, _user: any, _trx: any, source: string) => {
    // Push change
    await sendPush('move', source, {
      target: document.path,
    });
  },

  onAfterCopy: async (document: any, _user: any, _trx: any, source: string) => {
    // Push change
    await sendPush('copy', source, {
      target: document.path,
    });
  },

  onAfterAdd: async (document: any, _user: any, trx: any, req: any) => {
    // Fetch indexes
    if (!req.indexes) {
      const Index = models.get('Index');
      req.indexes = await Index.fetchAll({}, {}, trx);
    }

    // Get json to return
    req.document = document;
    const documentJson = await document.toJson(
      req,
      await getComponents(req, trx, ['catalog']),
    );

    // Push change
    await sendPush('add', document.path, documentJson);
  },

  onAfterModified: async (document: any, _user: any, trx: any, req: any) => {
    // Fetch indexes
    if (!req.indexes) {
      const Index = models.get('Index');
      req.indexes = await Index.fetchAll({}, {}, trx);
    }

    // Get json to return
    const documentJson = await document.toJson(
      req,
      await getComponents(req, trx, ['catalog']),
    );

    // Push change
    await sendPush('update', document.path, documentJson);
  },

  onBeforeDelete: async (document: any) => {
    // Push change
    await sendPush('delete', document.path, null);
  },

  onAfterChangeWorkflow: async (
    document: any,
    _user: any,
    trx: any,
    req: any,
  ) => {
    // Fetch indexes
    if (!req.indexes) {
      const Index = models.get('Index');
      req.indexes = await Index.fetchAll({}, {}, trx);
    }

    // Get json to return
    const documentJson = await document.toJson(
      req,
      await getComponents(req, trx, ['catalog']),
    );

    // Push change
    await sendPush('update', document.path, documentJson);
  },
};
