/**
 * Vocabularies route.
 * @module routes/vocabularies/vocabularies
 */

// Type imports
import type { Request } from '../../types';
import type { Knex } from 'knex';

// External imports
import { sortBy } from 'es-toolkit/compat';

// Internal imports
import config from '../../helpers/config/config';
import { RequestException } from '../../helpers/error/error';
import { getUrl } from '../../helpers/url/url';
import models from '../../models';
import { vocabularies } from '../../vocabularies';

export default [
  {
    op: 'get',
    view: '/@vocabularies',
    permission: 'View',
    client: 'getVocabularies',
    cache: 'static',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Vocabulary = models.get('Vocabulary');
      const profileVocabularies = await Vocabulary.fetchAll({}, {}, trx);
      return {
        json: sortBy(
          [
            ...Object.keys(vocabularies).map((vocabulary) => ({
              '@id': `${getUrl(req)}/@vocabularies/${vocabulary}`,
              title: vocabulary,
            })),
            ...profileVocabularies.map(
              (vocabulary: InstanceType<typeof Vocabulary>) => ({
                '@id': `${getUrl(req)}/@vocabularies/${vocabulary.id}`,
                title: vocabulary.title,
              }),
            ),
          ],
          'title',
        ),
      };
    },
  },
  {
    op: 'get',
    view: '/@vocabularies/:id',
    permission: 'View',
    client: 'getVocabulary',
    cache: 'dynamic',
    handler: async (req: Request, trx: Knex.Transaction) => {
      // Check if vocabulary is available
      if (
        !Object.keys(vocabularies).includes(req.params.id) &&
        !Object.keys(config.settings.vocabularies || {}).includes(req.params.id)
      ) {
        const Vocabulary = models.get('Vocabulary');
        const id =
          req.params.id === 'plone.contentrules.events'
            ? 'events'
            : req.params.id;
        const vocabulary = await Vocabulary.fetchById(id, {}, trx);
        if (!vocabulary) {
          throw new RequestException(404, { error: req.i18n('Not found.') });
        }

        // Return data
        return {
          json: {
            '@id': `${getUrl(req)}/@vocabularies/${id}`,
            items: vocabulary.items,
            items_total: vocabulary.items.length,
          },
        };
      }

      // Get items
      const items = Object.keys(vocabularies).includes(req.params.id)
        ? await vocabularies[req.params.id](req)
        : config.settings.vocabularies &&
            config.settings.vocabularies[req.params.id]
          ? await config.settings.vocabularies[req.params.id](req)
          : [];

      // Return data
      return {
        json: {
          '@id': `${getUrl(req)}/@vocabularies/${req.params.id}`,
          items,
          items_total: items.length,
        },
      };
    },
  },
];
