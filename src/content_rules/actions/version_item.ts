/**
 * Version item action for content rules
 * @module content_rules/actions/version_item
 */

// Type imports
import type { Params, Request } from '../../types';

// External imports
import dayjs from 'dayjs';
import { Knex } from 'knex';

export const version_item = {
  getTitle: (req: Request) => req.i18n('Version item'),
  getDescription: (req: Request) => req.i18n('Store a new version of the item'),
  getSummary: (req: Request, params: Params) =>
    req.i18n('Version item with comment {comment}', {
      comment: params.comment || req.i18n('None'),
    }),
  schema: {
    fieldsets: [
      {
        fields: ['comment'],
        id: 'default',
        'title:i18n': 'Default',
      },
    ],
    properties: {
      comment: {
        'description:i18n':
          'The comment added to the history while versioning the content.',
        factory: 'Text line (String)',
        'title:i18n': 'Comment',
        type: 'string',
      },
    },
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
    // Create new version
    const modified = dayjs.utc().format();
    const version = document.version + 1;
    await document.createRelated(
      '_versions',
      {
        document: document.uuid,
        id: document.id,
        created: modified,
        actor: user.id,
        version,
        json: {
          ...document.json,
          changeNote: params.comment,
        },
      },
      trx,
    );

    // Save version
    await document.update(
      {
        version,
      },
      trx,
    );
  },
};
