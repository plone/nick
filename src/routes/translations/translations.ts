/**
 * Translations routes.
 * @module routes/translations/translations
 */

// Type imports
import type { Request } from '../../types';
import type { Knex } from 'knex';

// Internal imports
import { getUrl, getUrlByPath, stripPath } from '../../helpers/url/url';
import models from '../../models';

export const handler = async (req: Request, trx: Knex.Transaction) => {
  const Document = models.get('Document');
  const Controlpanel = models.get('Controlpanel');
  const documents = req.document.translation_group
    ? await Document.fetchAll(
        { translation_group: req.document.translation_group },
        {},
        trx,
      )
    : [];
  const controlpanel = await Controlpanel.fetchById('language', {}, trx);
  const settings = controlpanel.data;

  return {
    json: {
      '@id': `${getUrl(req)}/@translations`,
      items: documents.models.map((document: any) => ({
        '@id': getUrlByPath(req, document.path),
        language: document.language,
      })),
      root: Object.fromEntries(
        settings.available_languages.map((language: string) => [
          language,
          getUrlByPath(req, `/${language}`),
        ]),
      ),
    },
    xkeys: [req.document.translation_group],
  };
};

export default [
  {
    op: 'get',
    view: '/@translations',
    permission: 'View',
    client: 'getTranslations',
    cache: 'content',
    handler,
  },
  {
    op: 'delete',
    view: '/@translations',
    permission: 'Modify',
    client: 'unlinkTranslation',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Document = models.get('Document');
      const document = await Document.fetchOne(
        {
          translation_group: req.document.translation_group,
          language: req.body.language,
        },
        {},
        trx,
      );
      await document.update(
        {
          translation_group: document.uuid,
        },
        trx,
      );
      return {
        json: {},
      };
    },
  },
  {
    op: 'post',
    view: '/@translations',
    permission: 'Modify',
    client: 'linkTranslation',
    cache: 'alter',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Document = models.get('Document');

      // Strip prefix of url
      const id = stripPath(req.body.id);

      let target;
      // Check if path
      if (id.startsWith('/')) {
        target = await Document.fetchOne({ path: id }, {}, trx);
        // Else it is a uuid
      } else {
        target = await Document.fetchOne({ uuid: id }, {}, trx);
      }

      // Link documents
      await target.update(
        {
          translation_group: req.document.translation_group,
        },
        trx,
      );

      return {
        json: {},
      };
    },
  },
  {
    op: 'get',
    view: '/@translation-locator',
    permission: 'View',
    client: 'getTranslationLocation',
    cache: 'manage',
    handler: async (req: Request, trx: Knex.Transaction) => {
      const Document = models.get('Document');

      // Fetch parent
      const parent = await Document.fetchOne({
        uuid: req.document.parent,
      });

      const document = await Document.fetchOne(
        {
          translation_group: parent.translation_group,
          language: req.query.target_language,
        },
        {},
        trx,
      );

      return {
        json: {
          '@id': document
            ? getUrlByPath(req, document.path)
            : getUrlByPath(
                req,
                req.document.type === 'Languageroot'
                  ? '/'
                  : `/${req.query.target_language}`,
              ),
        },
      };
    },
  },
];
