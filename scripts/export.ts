/* eslint no-console: 0 */
/**
 * Export script.
 * @module scripts/export
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { gunzipSync } from 'zlib';
import coreWorkflows from '../src/profiles/core/workflows.json';
import {
  convertBehaviors,
  convertComments,
  convertQueryOperations,
  convertRedirects,
  convertRelations,
  convertSharing,
  convertSiteSettings,
  convertUid,
  convertUserList,
  convertVersions,
  convertWorkflowHistory,
  exportBlobs,
  fetchAllBatches,
  forEachBatch,
  getAcquiredState,
  getCustomRoles,
  getDocumentFilename,
  getDocumentPath,
  getItems,
  getPositions,
  getTranslationGroup,
  mapPrincipalRoles,
  omitFields,
  parseTar,
  parseWorkflowBindings,
  relativizeUrls,
  virtualGroups,
} from '../src/helpers/export/export';
import { convertDefinition } from '../src/helpers/dcworkflow/dcworkflow';
import { stripI18n } from '../src/helpers/i18n/i18n';
import { mapAsync } from '../src/helpers/utils/utils';
import { omit } from 'es-toolkit/object';

// Users referenced by content
const principals = new Set<string>();

// Workflows, workflow chains by type and states by path
const workflowInfo: {
  workflows: Record<string, any>;
  default: string;
  types: Record<string, string[]>;
  states: Map<string, string>;
} = {
  workflows: Object.fromEntries(
    stripI18n(coreWorkflows).workflows.map((workflow: any) => [
      workflow.id,
      workflow,
    ]),
  ),
  default: 'simple_publication_workflow',
  types: {},
  states: new Map(),
};

/**
 * Get the workflow of a type
 * @param {string} type Id of the type.
 * @returns {string} Id of the workflow.
 */
const getTypeWorkflow = (type: string): string =>
  (workflowInfo.types[type] || [])[0] || workflowInfo.default;

// Uuids of the exported documents by path
const uuids = new Map<string, string>();

// Positions of the documents in their parent by path
let positions = new Map<string, number>();

// Types of folderish documents and of the root document
const typeInfo = {
  types: new Set<string>(),
  folderish: new Set<string>(),
  navroot: new Set<string>(),
};

/**
 * Add a user referenced by content
 * @param {string} id Id of the user.
 * @returns {string} Id of the user.
 */
const addPrincipal = (id: string): string => {
  principals.add(id);
  return id;
};

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
        id: `@plone/nick:${profile}`,
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
 * Convert roles. Only roles which are not in Nick's core profile are
 * exported, Plone's Manager, Site Administrator and Member roles are mapped
 * to Nick roles.
 * @param {Array} roles Roles to export.
 * @param {string} path Path of the output folder.
 */
const convertRoles = (roles: any[], path: string) => {
  process.stdout.write('Converting roles...');

  const output = getCustomRoles(roles).map((role) => ({
    id: role.id,
    'title:i18n': role.title,
    permissions: [], // Missing from API, need to be added manually
  }));

  // Write files
  writeFileSync(
    `${path}/roles.json`,
    JSON.stringify({ purge: false, roles: output }, null, 2),
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

  const output = groups
    .filter((group) => !virtualGroups.includes(group.id))
    .map((group) => ({
      id: group.id,
      'title:i18n': group.title,
      description: group.description,
      email: group.email || undefined, // Email is unique in Nick
      roles: mapPrincipalRoles(group.roles),
    }));

  // Write files
  writeFileSync(
    `${path}/groups.json`,
    JSON.stringify({ purge: false, groups: output }, null, 2),
  );

  console.log('done!');
};

/**
 * Convert users
 * @param {Array} users Users to export.
 * @param {string} path Path of the output folder.
 * @param {Object} login Login and password of the user running the export.
 */
const convertUsers = (
  users: any[],
  path: string,
  login: { login: string; password: string },
) => {
  process.stdout.write('Converting users...');

  const output = convertUserList(users, login, [...principals]);

  // Write files
  writeFileSync(
    `${path}/users.json`,
    JSON.stringify({ purge: false, users: output }, null, 2),
  );

  console.log('done!');
};

/**
 * Convert workflows. Workflow definitions are not available in the REST api,
 * they are read from the GenericSetup export of the workflow tool.
 * @param {string} path Path of the output folder.
 * @param {string} url Url
 * @param {string} token Auth token
 */
const convertWorkflows = async (path: string, url: string, token: string) => {
  process.stdout.write('Converting workflows...');

  const response = await fetch(
    `${url}/portal_setup/manage_exportSelectedSteps`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'ids:list=workflows',
    },
  );
  if (!response.ok) {
    console.log(
      `not available (${response.status}), using the workflows of the core profile`,
    );
    return;
  }
  const files = parseTar(gunzipSync(Buffer.from(await response.arrayBuffer())));

  // Get workflows (with guards, the id is the name of the directory) and
  // bindings; what can't be converted is listed
  const warnings: string[] = [];
  const workflows = Object.keys(files)
    .filter((file) => file.endsWith('/definition.xml'))
    .map((file) => {
      const converted = convertDefinition(
        files[file],
        file.split('/').slice(-2)[0],
      );
      warnings.push(...converted.warnings);
      return converted.workflow;
    });
  const bindings = parseWorkflowBindings(files['workflows.xml']);
  workflowInfo.workflows = Object.fromEntries(
    workflows.map((workflow) => [workflow.id, workflow]),
  );
  workflowInfo.default = bindings.default[0] || workflowInfo.default;
  workflowInfo.types = bindings.types;

  // Write files
  writeFileSync(
    `${path}/workflows.json`,
    JSON.stringify({ purge: false, replace: true, workflows }, null, 2),
  );

  console.log('done!');
  warnings.map((warning) => console.log(`  workflow ${warning}`));
};

/**
 * Convert redirects
 * @param {string} path Path of the output folder.
 * @param {string} url Url
 * @param {string} token Auth token
 */
const convertRedirectList = async (
  path: string,
  url: string,
  token: string,
) => {
  process.stdout.write('Converting redirects...');

  const aliases = await fetchAllBatches(`${url}/++api++/@aliases`, (batchUrl) =>
    fetchFromApi(batchUrl, 'GET', token),
  );
  const output = convertRedirects(aliases, uuids);

  // Write files
  writeFileSync(
    `${path}/redirects.json`,
    JSON.stringify({ purge: false, redirects: output }, null, 2),
  );

  console.log(`${output.length} done!`);
};

/**
 * Convert site and language settings
 * @param {string} path Path of the output folder.
 * @param {string} url Url
 * @param {string} token Auth token
 */
const convertSettings = async (path: string, url: string, token: string) => {
  process.stdout.write('Converting site settings...');

  const site = await fetchFromApi(`${url}/++api++/@site`, 'GET', token);

  // Write files
  mkdirSync(`${path}/controlpanels`, { recursive: true });
  convertSiteSettings(site).map((controlpanel) =>
    writeFileSync(
      `${path}/controlpanels/${controlpanel.id}.json`,
      JSON.stringify(controlpanel, null, 2),
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

  // Add types which are used but not listed, like the type of the root
  const listed = types.map((type) =>
    decodeURIComponent(type['@id'].split('/').pop()),
  );
  const all = [
    ...types.map((type, index) => ({ ...type, id: listed[index] })),
    ...[...typeInfo.types]
      .filter((id) => !listed.includes(id))
      .map((id) => ({ id, title: id, addable: false })),
  ];

  // Write types
  await mapAsync(all, async (type) => {
    const id = type.id;
    const schema = await fetchFromApi(
      `${url}/++api++/@types/${encodeURIComponent(id)}`,
      'GET',
      token,
    );
    const settings = await fetchFromApi(
      `${url}/++api++/@controlpanels/dexterity-types/${encodeURIComponent(id)}`,
      'GET',
      token,
    );

    // Write files
    writeFileSync(
      `${path}/types/${id.toLowerCase()}.json`,
      JSON.stringify(
        {
          id,
          'title:i18n': settings.data?.title || type.title,
          'description:i18n': settings.data?.description || '',
          global_allow: type.addable,
          filter_content_types: settings.data?.filter_content_types || false,
          allowed_content_types: settings.data?.allowed_content_types || [],
          schema: {
            ...schema, // TODO: Set fields title and description to use :i18n
            behaviors: convertBehaviors(settings.data, {
              folderish: typeInfo.folderish.has(id),
              navroot: typeInfo.navroot.has(id),
            }),
          },
          workflow: getTypeWorkflow(id),
          // The whole chain when a type has more than one workflow
          ...((workflowInfo.types[id] || []).length > 1
            ? { workflows: workflowInfo.types[id] }
            : {}),
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
 * @param {string} base_url Url of the site root
 */
const convertDocuments = async (
  path: string,
  url: string,
  token: string,
  base_url: string,
) => {
  process.stdout.write('Converting documents...');

  // Create types folder
  mkdirSync(`${path}/documents`, { recursive: true });

  // Get the order of the documents in their folders
  const paths: string[] = [];
  await forEachBatch(
    `${url}/++api++/@search?sort_on=getObjPositionInParent&sort_on=path`,
    (batchUrl: string) => fetchFromApi(batchUrl, 'GET', token),
    (items: any[]) => {
      paths.push(
        ...items
          .filter((item: any) => item['@type'] !== 'Discussion Item')
          .map((item: any) => getDocumentPath(item['@id'], base_url)),
      );
    },
  );
  positions = getPositions(paths);

  // Write documents batch by batch
  const count = await forEachBatch(
    `${url}/++api++/@search?sort_on=path`,
    (batchUrl: string) => fetchFromApi(batchUrl, 'GET', token),
    async (items: any[]) => {
      await mapAsync(
        // Comments are cataloged but they are not documents
        items.filter((item: any) => item['@type'] !== 'Discussion Item'),
        (document: any) => convertDocument(document, path, token, base_url),
      );
    },
  );

  console.log(`${count} done!`);
};

/**
 * Get the workflow state of a document. Types without workflow get the
 * state of the parent (see getAcquiredState).
 * @param {Object} json Json data of the document.
 * @param {string} path Path of the document.
 * @returns {string} Workflow state.
 */
const getWorkflowState = (json: any, path: string): string => {
  const type = json['@type'];
  const workflow = workflowInfo.workflows[getTypeWorkflow(type)];
  const state =
    json.review_state &&
    (workflowInfo.types[type] || [workflow.id]).length > 0 &&
    json.review_state in workflow.json.states
      ? json.review_state
      : getAcquiredState(
          workflow,
          path === '/'
            ? undefined
            : workflowInfo.states.get(
                path.substring(0, path.lastIndexOf('/')) || '/',
              ),
        );
  workflowInfo.states.set(path, state);
  return state;
};

/**
 * Convert document
 * @param {Object} document Search result of the document.
 * @param {string} path Path of the output folder.
 * @param {string} token Auth token
 * @param {string} base_url Url of the site root
 */
const convertDocument = async (
  document: any,
  path: string,
  token: string,
  base_url: string,
) => {
  const doc_path = getDocumentPath(document['@id'], base_url);
  const filename = getDocumentFilename(doc_path);
  const json = await fetchFromApi(
    `${document['@id']}?expand=translations`,
    'GET',
    token,
  );
  const translation_group = getTranslationGroup(
    doc_path,
    json['@components']?.translations,
    base_url,
  );

  // Get workflow history, oldest first
  const { history } = await fetchFromApi(
    `${document['@id']}/@workflow`,
    'GET',
    token,
  );
  history.map((entry: any) => addPrincipal(entry.actor));

  // Get versions, oldest first
  const plone_versions = await convertVersions(
    await fetchFromApi(`${document['@id']}/@history`, 'GET', token),
    (version: number) =>
      fetchFromApi(`${document['@id']}/@history/${version}`, 'GET', token),
  );
  plone_versions.map((version: any) => addPrincipal(version.actor));

  // Get comments, the endpoint is missing without plone.app.discussion
  const comments = convertComments(
    await fetchAllBatches(`${document['@id']}/@comments`, (batchUrl) =>
      fetchFromApi(batchUrl, 'GET', token, undefined, true),
    ),
  );
  comments.map((comment: any) => addPrincipal(comment.author));

  // Download files and images
  const uuid = convertUid(json.UID);
  uuids.set(doc_path, uuid);
  const { json: fields, versions } = await exportBlobs(
    omit(json, omitFields),
    plone_versions,
    uuid,
    (field: string) =>
      fetchBlob(`${document['@id']}/@@download/${field}`, token),
    (blob: string, data: Buffer) => {
      mkdirSync(`${path}/documents${dirname(blob)}`, { recursive: true });
      writeFileSync(`${path}/documents${blob}`, data);
    },
  );

  // Keep type information
  typeInfo.types.add(json['@type']);
  if (json.is_folderish) {
    typeInfo.folderish.add(json['@type']);
  }
  if (doc_path === '/') {
    typeInfo.navroot.add(json['@type']);
  }

  // Write files
  writeFileSync(
    `${path}/documents/${filename}`,
    JSON.stringify(
      {
        path: doc_path,
        type: json['@type'],
        uuid,
        owner: addPrincipal(json.creators[0]),
        workflow_state: getWorkflowState(json, doc_path),
        workflow_history: convertWorkflowHistory(
          history,
          workflowInfo.workflows[getTypeWorkflow(json['@type'])],
        ),
        language: json.language?.token ?? json.language,
        ...(translation_group ? { translation_group } : {}),
        position_in_parent: positions.get(doc_path) || 0,
        ...convertQueryOperations(
          relativizeUrls(convertRelations(fields), base_url),
        ),
        ...(comments.length > 0 ? { comments } : {}),
        ...convertSharing(
          await fetchFromApi(`${document['@id']}/@sharing`, 'GET', token),
        ),
        ...(versions.length > 0
          ? {
              versions: versions.map((version: any) =>
                convertQueryOperations(
                  relativizeUrls(convertRelations(version), base_url),
                ),
              ),
            }
          : {}),
      },
      null,
      2,
    ),
  );
};

/**
 * Fetch from API
 * @param {string} url Url
 * @param {string} method Http method
 * @param {string} token Auth token
 * @param {any} body Body
 * @param {boolean} optional Return nothing instead of failing on not found
 * @returns {Promise<any>} Response data
 */
async function fetchFromApi(
  url: string,
  method: string,
  token?: string,
  body?: any,
  optional: boolean = false,
): Promise<any> {
  const headers: any = {
    Accept: 'application/json',
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
  if (optional && response.status === 404) {
    return undefined;
  }
  if (!response.ok) {
    throw new Error(
      `${method} ${url} failed: ${response.status} ${await response.text()}`,
    );
  }
  return response.json();
}

/**
 * Fetch a blob
 * @param {string} url Url
 * @param {string} token Auth token
 * @returns {Promise<Buffer>} Data
 */
async function fetchBlob(url: string, token: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
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

  // Permissions are not exported: Zope permissions don't apply to Nick, the
  // permissions of Nick's core profile are kept.

  // Convert site and language settings
  await convertSettings(outputfolder, url, token);

  // Convert roles
  const roles = await fetchFromApi(`${url}/++api++/@roles`, 'GET', token);
  convertRoles(roles, outputfolder);

  // Convert groups, the groups endpoint is not batched
  const groups = getItems(
    await fetchFromApi(`${url}/++api++/@groups`, 'GET', token),
  );
  convertGroups(groups, outputfolder);

  // Actions are not exported: Plone actions are user interface settings
  // with TALES conditions, the actions of Nick's core profile are kept.

  // Convert content rules
  // TODO

  // Convert workflows, before the documents which use the states
  await convertWorkflows(outputfolder, url, token);

  // Convert documents
  const root = await fetchFromApi(`${url}/++api++`, 'GET', token);
  await convertDocuments(outputfolder, url, token, root['@id']);

  // Convert redirects, after the documents they point to
  await convertRedirectList(outputfolder, url, token);

  // Convert types, after the documents to know which types are folderish
  const types = await fetchFromApi(`${url}/++api++/@types`, 'GET', token);
  await convertTypes(types, outputfolder, url, token);

  // Convert users, including users referenced by content
  const users = await fetchAllBatches(`${url}/++api++/@users`, (batchUrl) =>
    fetchFromApi(batchUrl, 'GET', token),
  );
  convertUsers(users, outputfolder, { login, password });
}

main();
