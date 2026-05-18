/**
 * Move item action for content rules
 * @module content_rules/actions/move_item
 */

// Type imports
import type { Params, Reference, Request } from '../../types';

// External imports
import { flattenDeep, uniq } from 'es-toolkit/array';
import { Knex } from 'knex';

// Internal imports
import config from '../../helpers/config/config';
import { removeFile } from '../../helpers/fs/fs';
import { mapAsync, uniqueId } from '../../helpers/utils/utils';
import models from '../../models';

export const move_item = {
  getTitle: (req: Request) => req.i18n('Move to folder'),
  getDescription: (req: Request) =>
    req.i18n('Move the triggering item to a specific folder'),
  getSummary: (req: Request, params: Params) =>
    req.i18n('Move to folder {target_folder}', {
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
    const Version = models.get('Version');
    await mapAsync(params.target_folder, async (targetFolder: Reference) => {
      // Get target parent
      const targetParent = await Document.fetchOne({ path: targetFolder.path });

      // Get children
      await targetParent.fetchChildren({}, trx, false);
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
      await targetParent.fetchChildren({}, trx, false);
      await targetParent.fixOrder(trx);

      // Reindex children
      await targetParent.reindexChildren(trx);
    });

    // Check if target folder
    if (params.target_folder && params.target_folder.length > 0) {
      await document.fetchRelated('_type', trx);

      // Get file and image fields
      const fileFields = document._type.getFactoryFields('File');
      const imageFields = document._type.getFactoryFields('Image');

      // If file fields exist
      if (fileFields.length > 0 || imageFields.length > 0) {
        // Get versions
        await document.fetchRelated('_versions', trx);

        // Get all file uuids from all versions and all fields
        const files: string[] = uniq(
          flattenDeep(
            document._versions.map((version: InstanceType<typeof Version>) => [
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
        await mapAsync(files, async (file: string) => await removeFile(file));
      }

      // Get parent
      await document.fetchRelated('_parent', trx);
      const parent = document._parent;

      // Remove document (versions will be cascaded)
      await document.delete(trx);

      // Fix order in parent
      await parent.fetchChildren({}, trx, false);
      await parent.fixOrder(trx);

      // Reindex children
      await parent.reindexChildren(trx);

      // Reindex parent
      await parent.reindex(trx);
    }
  },
};
