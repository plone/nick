/**
 * Copy item action for content rules
 * @module content_rules/actions/copy_item
 */

// Type imports
import type { Params, Reference, Request } from '../../types';

// External imports
import { Knex } from 'knex';

// Internal imports
import { mapAsync, uniqueId } from '../../helpers/utils/utils';
import models from '../../models';

export const copy_item = {
  getTitle: (req: Request) => req.i18n('Copy to folder'),
  getDescription: (req: Request) =>
    req.i18n('Copy the triggering item to a specific folder'),
  getSummary: (req: Request, params: Params) =>
    req.i18n('Copy to folder {target_folder}', {
      target_folder:
        params.target_folder && params.target_folder.length > 0
          ? params.target_folder.map((item: Reference) => item.path).join(', ')
          : req.i18n('None'),
    }),
  schema: {
    fieldsets: [
      {
        fields: ['target_folder'],
        id: 'default',
        title: 'Default',
      },
    ],
    properties: {
      target_folder: {
        'description:i18n': 'As a path relative to the portal root.',
        'title:i18n': 'Target folder',
        widget: 'object_browser',
        factory: 'Relation Choice',
      },
    },
    required: ['target_folder'],
    type: 'object',
  },
  handler: async (
    params: Params,
    document: any,
    _user: any,
    _contentRule: any,
    trx: Knex.Transaction,
  ) => {
    const Document = models.get('Document');
    await mapAsync(params.target_folder, async (targetFolder: Reference) => {
      // Get target parent
      const targetParent = await Document.fetchOne({ path: targetFolder.path });

      // Get children
      await targetParent.fetchRelated('_children', trx);
      const childIds = targetParent._children.map((child: any) => child.id);

      // Calculate new id and path
      const path = targetFolder.path;
      const newId = uniqueId(document.id, childIds);
      const newPath = `${path}${path === '/' ? '' : '/'}${newId}`;

      // Copy object
      const copiedDocument = await document.copy(
        targetParent.uuid,
        newPath,
        newId,
        trx,
      );
      await copiedDocument.fetchRelated('_parent', trx);

      // Fetch new children and fix order
      await targetParent.fetchRelated('_children', trx);
      await targetParent.fixOrder(trx);

      // Reindex children
      await targetParent.reindexChildren(trx);
    });
  },
};
