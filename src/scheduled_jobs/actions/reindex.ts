/**
 * Reindex item action for scheduled jobs
 * @module scheduled_jobs/actions/reindex
 */

// Type imports
import type { Params, Request } from '../../types';

// External imports
import { Knex } from 'knex';

// Internal imports
import { mapAsync } from '../../helpers/utils/utils';
import models from '../../models';

export const reindex = {
  getTitle: (req: Request) => req.i18n('Reindex items'),
  getDescription: (req: Request) => req.i18n('Reindex items based on type'),
  getSummary: (req: Request, params: Params) =>
    req.i18n('Reindex items of type {type}', {
      type:
        params.type && params.type.length > 0
          ? params.type.join(', ')
          : req.i18n('None'),
    }),
  schema: {
    fieldsets: [
      {
        fields: ['type'],
        id: 'default',
        title: 'Default',
      },
    ],
    properties: {
      type: {
        additionalItems: true,
        'description:i18n': 'The content type to reindex.',
        factory: 'Multiple Choice',
        items: {
          description: '',
          factory: 'Choice',
          title: '',
          type: 'string',
          vocabulary: {
            '@id': 'types',
          },
        },
        'title:i18n': 'Content type',
        type: 'array',
        uniqueItems: true,
      },
    },
    required: ['type'],
    type: 'object',
  },
  handler: async (params: Params, actor: string, trx: Knex.Transaction) => {
    // Get all documents of the specified type
    const Document = models.get('Document');
    const documents = await Document.fetchAll(
      {
        type: params.type,
      },
      {},
      trx,
    );

    // Reindex the documents
    await mapAsync(documents, async (document: any) => {
      await document.reindex(trx);
    });

    // Return success
    return { status: 'success' };
  },
};
