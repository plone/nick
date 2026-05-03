/**
 * Catalog seed.
 * @module seeds/catalog/catalog
 */

// Type imports
import type { Knex } from 'knex';

// Internal imports
import config from '../../helpers/config/config';
import { fileExists } from '../../helpers/fs/fs';
import { stripI18n } from '../../helpers/i18n/i18n';
import { mapAsync } from '../../helpers/utils/utils';
import models from '../../models';

export const seedCatalog = async (
  trx: Knex.Transaction,
  profilePath: string,
): Promise<void> => {
  const Index = models.get('Index');
  if (await fileExists(`${profilePath}/catalog`)) {
    const profile = stripI18n((await import(`${profilePath}/catalog`)).default);
    await mapAsync(profile.indexes, async (index: any) => {
      // Add index
      await Index.create(
        {
          id: `_${index.name}`,
          name: index.name,
          title: index.title,
          type: index.type,
          attr: index.attr,
          metadata: false,
          description: index.description,
          group: index.group,
          enabled: index.enabled,
          sortable: index.sortable,
          operators: index.operators,
          vocabulary: index.vocabulary,
        },
        {},
        trx,
      );
      // Update catalog table
      await trx.schema.alterTable('catalog', async (table: any) => {
        const field = `_${index.name}`;
        switch (index.type) {
          case 'string':
            table.string(field).index();
            break;
          case 'integer':
            table.integer(field).index();
            break;
          case 'path':
            table.string(field).index();
            break;
          case 'uuid':
            table.uuid(field).index();
            break;
          case 'boolean':
            table.boolean(field).index();
            break;
          case 'date':
            table.dateTime(field).index();
            break;
          case 'string[]':
            table.specificType(field, 'character varying(255)[]').index();
            break;
          case 'uuid[]':
            table.specificType(field, 'uuid[]').index();
            break;
          case 'embed':
            table.specificType(
              field,
              `vector(${config.settings.ai.models.embed.dimensions})`,
            );
            break;
          case 'text':
            table.specificType(field, 'tsvector').index(null, 'GIN');
            break;
          default:
            console.log(`Unhandled index type: ${index.type}`);
            break;
        }
      });
    });
    await mapAsync(profile.metadata, async (metadata: any) => {
      // Add index
      await Index.create(
        {
          id: metadata.name,
          name: metadata.name,
          type: metadata.type,
          attr: metadata.attr,
          enabled: metadata.enabled === false ? false : true,
          metadata: true,
        },
        {},
        trx,
      );
      await trx.schema.alterTable('catalog', async (table: any) => {
        switch (metadata.type) {
          case 'uuid':
            table.uuid(metadata.name);
            break;
          case 'string':
            table.string(metadata.name);
            break;
          case 'date':
            table.dateTime(metadata.name);
            break;
          case 'integer':
            table.integer(metadata.name);
            break;
          case 'boolean':
            table.boolean(metadata.name);
            break;
          case 'json':
            table.json(metadata.name);
            break;
          case 'string[]':
            table.specificType(metadata.name, 'character varying(255)[]');
            break;
          case 'text':
            table.text(metadata.name);
            break;
          default:
            console.log(`Unhandled index type: ${metadata.type}`);
            break;
        }
      });
    });
    console.log('Catalog imported');
  }
};
