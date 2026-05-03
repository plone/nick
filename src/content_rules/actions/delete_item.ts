/**
 * Delete item action for content rules
 * @module content_rules/actions/delete_item
 */

// Type imports
import type { Params, Request } from '../../types';

// External imports
import { flattenDeep, uniq } from 'es-toolkit/array';
import { Knex } from 'knex';

// Internal imports
import config from '../../helpers/config/config';
import { removeFile } from '../../helpers/fs/fs';
import { mapAsync } from '../../helpers/utils/utils';

export const delete_item = {
  getTitle: (req: Request) => req.i18n('Delete item'),
  getDescription: (req: Request) => req.i18n('Delete the triggering item'),
  getSummary: (req: Request, params: Params) => req.i18n('Delete item'),
  schema: {
    fieldsets: [
      {
        fields: [],
        id: 'default',
        title: 'Default',
      },
    ],
    properties: {},
    required: [],
    type: 'object',
  },
  handler: async (
    params: Params,
    document: any,
    user: any,
    contentRule: any,
    trx: Knex.Transaction,
  ) => {
    await document.fetchRelated('_type', trx);

    // Get file and image fields
    const fileFields = document._type.getFactoryFields('File');
    const imageFields = document._type.getFactoryFields('Image');

    // If file fields exist
    if (fileFields.length > 0 || imageFields.length > 0) {
      // Get versions
      await document.fetchRelated('_versions', trx);

      // Get all file uuids from all versions and all fields
      const files = uniq(
        flattenDeep(
          document._versions.map((version: any) => [
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
      await mapAsync(files, async (file: any) => await removeFile(file));
    }

    // Get parent
    await document.fetchRelated('_parent', trx);
    const parent = document._parent;

    // Remove document (versions will be cascaded)
    await document.delete(trx);

    // Fix order in parent
    await parent.fetchRelated('_children(order)', trx);
    await parent.fixOrder(trx);

    // Reindex children
    await parent.reindexChildren(trx);

    // Reindex parent
    await parent.reindex(trx);
  },
};
