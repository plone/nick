/**
 * Document seed.
 * @module seeds/document/document
 */

// Type imports
import type { Knex } from 'knex';

// External imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { dropRight, last } from 'es-toolkit/array';
import { isEqual } from 'es-toolkit/predicate';
import { omit } from 'es-toolkit/object';
import { promises as fs } from 'fs';
import { v4 as uuid } from 'uuid';

// Internal imports
import {
  handleBlocks,
  handleFiles,
  handleImages,
  handleRelationLists,
} from '../../helpers/content/content';
import { dirExists } from '../../helpers/fs/fs';
import { getFactoryFields } from '../../helpers/schema/schema';
import { stripI18n } from '../../helpers/i18n/i18n';
import { mapAsync } from '../../helpers/utils/utils';
import models from '../../models';

dayjs.extend(utc);

const documentFields = [
  'uuid',
  'parent',
  'id',
  'path',
  'deleted',
  'created',
  'modified',
  'type',
  'position_in_parent',
  'version',
  'versions',
  'owner',
  'lock',
  'inherit_roles',
  'translation_group',
  'language',
  'workflow_state',
  'workflow_history',
  'workflow_status',
  'sharing',
  'content_rules',
];

const versionFields = ['uuid', 'version', 'id', 'created', 'actor', 'document'];

export const seedDocument = async (
  trx: Knex.Transaction,
  profilePath: string,
): Promise<void> => {
  const Document = models.get('Document');
  const Type = models.get('Type');
  const uuids: string[] = [];

  if (await dirExists(`${profilePath}/documents`)) {
    const children: Record<string, number> = {};
    const files = (await fs.readdir(`${profilePath}/documents`))
      .filter((file: string) => file.endsWith('.json'))
      .map((file: string) => dropRight(file.split('.'), 1).join('.'))
      .sort((a: string, b: string) =>
        a === '_root' ? -1 : b === '_root' ? 1 : a < b ? -1 : a > b ? 1 : 0,
      );
    await mapAsync(files, async (file: string) => {
      let document: any = stripI18n(
        (await import(`${profilePath}/documents/${file}`)).default,
      );

      // Get the path from the document or else from the filename
      const slugs = file.split('.');
      const path =
        document.path ||
        (last(slugs) === '_root' ? '/' : `/${slugs.join('/')}`);
      const id = path === '/' ? 'root' : last(path.split('/'));
      const parent =
        path === '/'
          ? undefined
          : (
              await Document.fetchOne(
                {
                  path: path.substring(0, path.lastIndexOf('/')) || '/',
                },
                {},
                trx,
              )
            ).uuid;
      const position_in_parent = parent ? children[parent] || 0 : 0;
      if (parent) {
        children[parent] = parent in children ? children[parent] + 1 : 1;
      }

      const versionCount =
        'versions' in document ? document.versions.length : 1;

      // Handle files and images
      const type = await Type.fetchById(document.type || 'Page', {}, trx);
      const schema = type._schema;
      const original = document;
      document = await handleBlocks(document);
      document = await handleFiles(
        document,
        schema,
        trx,
        `${profilePath}/documents`,
      );
      document = await handleImages(
        document,
        schema,
        trx,
        `${profilePath}/documents`,
      );
      document = await handleRelationLists(document, schema);

      const newUuid = document.uuid || uuid();

      // Insert document
      const insert: any = await Document.create(
        {
          uuid: newUuid,
          version: 'version' in document ? document.version : versionCount - 1,
          id,
          path,
          parent,
          position_in_parent: document.position_in_parent ?? position_in_parent,
          lock: document.lock || {
            locked: false,
            stealable: true,
          },
          inherit_roles: document.inherit_roles === false ? false : true,
          owner: document.owner || 'admin',
          deleted: document.deleted || false,
          workflow_state: document.workflow_state || 'published',
          workflow_history: JSON.stringify(document.workflow_history || []),
          type: document.type || 'Page',
          created: document.created || dayjs.utc().format(),
          modified: document.modified || dayjs.utc().format(),
          translation_group: document.translation_group || newUuid,
          language: document.language,
          json: omit(document, documentFields),
        },
        {},
        trx,
      );

      // Save uuid
      uuids.push(insert.uuid);

      // Restore the workflow variables
      await insert.restoreWorkflowStatus(trx, document.workflow_status);

      // Handle files and images of versions, unchanged files are shared
      // with the document
      const blobFields = [
        ...getFactoryFields(schema, 'File'),
        ...getFactoryFields(schema, 'Image'),
      ];
      if ('versions' in document) {
        document.versions = await mapAsync(
          document.versions,
          async (version: any) => {
            const unchanged = blobFields.filter(
              (field) =>
                field in version && isEqual(version[field], original[field]),
            );
            let json: any = omit(version, unchanged);
            json = await handleFiles(
              json,
              schema,
              trx,
              `${profilePath}/documents`,
            );
            json = await handleImages(
              json,
              schema,
              trx,
              `${profilePath}/documents`,
            );
            unchanged.map((field) => (json[field] = document[field]));
            return json;
          },
        );
      }

      // Create versions
      const versions =
        'versions' in document
          ? document.versions.map((version: any, index: number) => ({
              version: version.version || index,
              created: version.created || dayjs.utc().format(),
              actor: version.actor || 'admin',
              id: version.id || id,
              json: omit(version, versionFields),
            }))
          : [
              {
                version: 0,
                created: document.created || dayjs.utc().format(),
                actor: document.owner || 'admin',
                id,
                json: omit(document, documentFields),
              },
            ];

      // Insert versions
      await mapAsync(versions, async (version: any) => {
        await insert.createRelated('_versions', version, trx);
      });

      // Insert sharing data for users
      const sharingUsers = document.sharing?.users || [];
      await mapAsync(sharingUsers, async (user: any) =>
        mapAsync(
          user.roles,
          async (role: any) =>
            await insert
              .$relatedQuery('_userRoles', trx)
              .relate({ id: role, user: user.id }),
        ),
      );

      // Insert sharing data for groups
      const sharingGroups = document.sharing?.groups || [];
      await mapAsync(sharingGroups, async (group: any) =>
        mapAsync(
          group.roles,
          async (role: any) =>
            await insert
              .$relatedQuery('_groupRoles', trx)
              .relate({ id: role, group: group.id }),
        ),
      );

      // Insert content rule data for the document
      const contentRules = document.content_rules || [];
      await mapAsync(
        contentRules,
        async (contentRule: any) =>
          await insert.$relatedQuery('_contentRules', trx).relate({
            id: contentRule.id,
            enabled: contentRule.enabled,
            bubble: contentRule.bubble,
          }),
      );
    });

    // Index documents
    await mapAsync(uuids, async (uuid: string) => {
      const document: any = await Document.fetchOne({ uuid }, {}, trx);

      // Apply behaviors
      await document.applyBehaviors(trx);

      // Index object
      await document.index(trx);
    });

    console.log('Documents imported');
  }
};
