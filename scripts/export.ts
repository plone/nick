/* eslint no-console: 0 */
/**
 * Export script.
 * @module scripts/export
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { v4 as uuid } from 'uuid';
import { mapAsync } from '../src/helpers/utils/utils';
import { omit } from 'es-toolkit/object';

/**
 * Write metadata
 * @param {string} path Path of the output folder.
 * @param {string} profile Name of the profile.
 */
const writeMetadata = (path: string, profile: string) => {
  process.stdout.write('Writing metadata...');

  // Write files
  writeFileSync(
    `${path}/metadata.json`,
    JSON.stringify(
      {
        id: `@robgietema/nick:${profile}`,
        title: 'Migrated Content',
        description: 'Migrated Content from external system',
        version: 1000,
      },
      null,
      2,
    ),
  );

  console.log('done!');
};

/**
 * Convert permissions
 * @param {Array} permissions Permissions to export.
 * @param {string} path Path of the output folder.
 */
const convertPermissions = (permissions: any[], path: string) => {
  process.stdout.write('Converting permissions...');

  const output = permissions.map((permission) => ({
    id: permission.token,
    'title:i18n': permission.title,
  }));

  // Write files
  writeFileSync(
    `${path}/permissions.json`,
    JSON.stringify({ purge: true, permissions: output }, null, 2),
  );

  console.log('done!');
};

/**
 * Convert roles
 * @param {Array} roles Roles to export.
 * @param {string} path Path of the output folder.
 */
const convertRoles = (roles: any[], path: string) => {
  process.stdout.write('Converting roles...');

  const output = roles.map((role) => ({
    id: role.id,
    'title:i18n': role.title,
    permissions: [], // Missing from API, need to be added manually
  }));

  // Write files
  writeFileSync(
    `${path}/roles.json`,
    JSON.stringify({ purge: true, roles: output }, null, 2),
  );

  console.log('done!');
};

/**
 * Convert groups
 * @param {Array} groups Groups to export.
 * @param {string} path Path of the output folder.
 */
const convertGroups = (groups: any[], path: string) => {
  process.stdout.write('Converting groups...');

  const output = groups.map((group) => ({
    id: group.id,
    'title:i18n': group.title,
    description: group.description,
    email: group.email,
    roles: group.roles,
  }));

  // Write files
  writeFileSync(
    `${path}/groups.json`,
    JSON.stringify({ purge: true, groups: output }, null, 2),
  );

  console.log('done!');
};

/**
 * Convert users
 * @param {Array} users Users to export.
 * @param {string} path Path of the output folder.
 */
const convertUsers = (users: any[], path: string) => {
  process.stdout.write('Converting users...');
  const password = uuid(); // Random password, need to be reset by users

  const output = users.map((user) => ({
    id: user.username,
    password,
    fullname: user.fullname,
    email: user.email,
    roles: user.roles,
    groups: user.groups.items.map((group: any) => group.id),
  }));

  // Write files
  writeFileSync(
    `${path}/users.json`,
    JSON.stringify({ purge: true, users: output }, null, 2),
  );

  console.log('done!');
};

/**
 * Convert actions
 * @param {Object} actions Actions to export.
 * @param {string} path Path of the output folder.
 */
const convertActions = (actions: any, path: string) => {
  process.stdout.write('Converting actions...');

  const getActions = (actions: any) =>
    actions
      ? actions.map((action: any) => ({
          id: action.id,
          'title:i18n': action.title,
          permission: 'Manage', // Not available in API
        }))
      : [];

  // Write files
  writeFileSync(
    `${path}/actions.json`,
    JSON.stringify(
      {
        purge: true,
        document_actions: [],
        object: getActions(actions.object),
        object_buttons: getActions(actions.object_buttons),
        user: getActions(actions.user),
        site_actions: getActions(actions.site_actions),
      },
      null,
      2,
    ),
  );

  console.log('done!');
};

/**
 * Convert types
 * @param {Array} types Types to export.
 * @param {string} path Path of the output folder.
 * @param {string} url Url
 * @param {string} token Auth token
 */
const convertTypes = async (
  types: any[],
  path: string,
  url: string,
  token: string,
) => {
  process.stdout.write('Converting types...');

  // Create types folder
  mkdirSync(`${path}/types`, { recursive: true });

  // Write types
  await mapAsync(types, async (type) => {
    const schema = await fetchFromApi(
      `${url}/++api++/@types/${type.id}`,
      'GET',
      token,
    );

    // Write files
    writeFileSync(
      `${path}/types/${type.id.toLowerCase()}.json`,
      JSON.stringify(
        {
          id: type.id,
          'title:i18n': type.title,
          'description:i18n': '', // TODO: Not available in API
          global_allow: type.immediately_addable,
          filter_content_types: false, // TODO: Not available in API
          allowed_content_types: [], // TODO: Not available in API
          schema, // TODO: Set fields title and description to use :i18n
          workflow: 'simple_publication_workflow', // TODO: Not available in API
        },
        null,
        2,
      ),
    );
  });

  console.log('done!');
};

/**
 * Convert documents
 * @param {string} path Path of the output folder.
 * @param {string} url Url
 * @param {string} token Auth token
 */
const convertDocuments = async (path: string, url: string, token: string) => {
  process.stdout.write('Converting documents...');

  // Create types folder
  mkdirSync(`${path}/documents`, { recursive: true });

  const documents = await fetchFromApi(
    `${url}/++api++/@search?sort_on=path&b_size=100000`,
    'GET',
    token,
  );

  // Get base url
  const base_url = documents['@id'].split('/++api++')[0];

  // Write documents
  await mapAsync(documents.items, async (document: any) => {
    const doc_path = document['@id'].replace(base_url, '');
    const filename =
      doc_path === ''
        ? '_root.json'
        : `${doc_path.substring(1).replaceAll('/', '.')}.json`;
    const json = await fetchFromApi(`${url}/++api++$${doc_path}`, 'GET', token);
    console.log(filename);

    // Write files
    writeFileSync(
      `${path}/documents/${filename}`,
      JSON.stringify(
        {
          type: json['@type'],
          uuid: json.UID.replace(
            /^([\da-f]{8})([\da-f]{4})([\da-f]{4})([\da-f]{4})([\da-f]{12})$/i,
            '$1-$2-$3-$4-$5',
          ),
          owner: json.creators[0],
          workflow_state: json.review_state,
          language: json.language.token,
          ...omit(json, [
            '@components',
            '@id',
            '@type',
            'UID',
            'creators',
            'items',
            'items_total',
            'is_folderish',
            'lock',
            'allow_discussion',
            'next_item',
            'previous_item',
            'type_title',
            'version',
            'versioning_enabled',
            'working_copy',
            'working_copy_of',
            'review_state',
            'language',
            'changeNote',
            'contributors',
            'parent',
          ]),
        },
        null,
        2,
      ),
    );
  });

  console.log('done!');
};

/**
 * Fetch from API
 * @param {string} url Url
 * @param {string} method Http method
 * @param {string} token Auth token
 * @param {any} body Body
 * @returns {Promise<any>} Response data
 */
async function fetchFromApi(
  url: string,
  method: string,
  token?: string,
  body?: any,
): Promise<any> {
  const headers: any = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json();
}

/**
 * Main function
 * @function main
 * @return {undefined}
 */
async function main() {
  // Check arguments
  if (process.argv.length !== 6) {
    console.log('Usage: pnpm export <url> <login> <password> <outputprofile>');
    return;
  }

  // Get folders
  const url = process.argv[2];
  const login = process.argv[3];
  const password = process.argv[4];
  const outputfolder = `./src/profiles/${process.argv[5]}`;

  // Create output folder
  if (!existsSync(outputfolder)) {
    mkdirSync(outputfolder, { recursive: true });
  }

  // Get auth token
  const token = await fetchFromApi(`${url}/++api++/@login`, 'POST', undefined, {
    login,
    password,
  }).then((data) => data.token);

  // Write metadata
  writeMetadata(outputfolder, process.argv[5]);

  // Convert permissions
  const permissions = await fetchFromApi(
    `${url}/++api++/@vocabularies/plone.app.vocabularies.Permissions?b_size=10000`,
    'GET',
    token,
  );
  convertPermissions(permissions.items, outputfolder);

  // Convert roles
  const roles = await fetchFromApi(`${url}/++api++/@roles`, 'GET', token);
  convertRoles(roles, outputfolder);

  // Convert groups
  const groups = await fetchFromApi(`${url}/++api++/@groups`, 'GET', token);
  convertGroups(groups, outputfolder);

  // Convert users
  const users = await fetchFromApi(`${url}/++api++/@users`, 'GET', token);
  convertUsers(users, outputfolder);

  // Convert actions
  const actions = await fetchFromApi(`${url}/++api++/@actions`, 'GET', token);
  convertActions(actions, outputfolder);

  // Convert workflow
  // TODO: No API available

  // Convert content rules
  // TODO

  // Convert types
  const types = await fetchFromApi(`${url}/++api++/@types`, 'GET', token);
  await convertTypes(types, outputfolder, url, token);

  // Convert documents
  await convertDocuments(outputfolder, url, token);
}

main();
