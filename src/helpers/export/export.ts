/**
 * Export helper.
 * @module helpers/export/export
 */

// External imports
import { createHash, randomBytes } from 'crypto';
import { omit } from 'es-toolkit/object';

// The workflow definitions are converted by the DCWorkflow loader
export {
  type XmlElement,
  convertWorkflow,
  mapWorkflowRole,
  parseWorkflowBindings,
  parseXml,
} from '../dcworkflow/dcworkflow';
export { permissionMapping } from '../workflow/workflow';

/**
 * Convert a Plone uid (32 hex characters) to a uuid.
 * @method convertUid
 * @param {string} uid Plone uid.
 * @returns {string} Uuid.
 */
export function convertUid(uid: string): string {
  return uid.replace(
    /^([\da-f]{8})([\da-f]{4})([\da-f]{4})([\da-f]{4})([\da-f]{12})$/i,
    '$1-$2-$3-$4-$5',
  );
}

/**
 * Get the path of a document relative to the site root from its url.
 * @method getDocumentPath
 * @param {string} url Url of the document.
 * @param {string} baseUrl Url of the site root.
 * @returns {string} Decoded path, `/` for the site root.
 */
export function getDocumentPath(url: string, baseUrl: string): string {
  const path = url.replace(baseUrl, '');
  return path === '' ? '/' : decodeURIComponent(path);
}

/**
 * Get the profile filename of a document. Every character of an id which
 * is not a letter, digit, dash or underscore is escaped as `~<hex>`, so
 * dots in ids (`report.pdf`) don't clash with the dots separating the path
 * segments. The parent filename is always a prefix of the child filename,
 * so sorting the filenames imports parents before their children.
 * @method getDocumentFilename
 * @param {string} path Decoded path of the document.
 * @returns {string} Filename of the document.
 */
export function getDocumentFilename(path: string): string {
  if (path === '' || path === '/') {
    return '_root.json';
  }
  const slugs = path
    .replace(/^\//, '')
    .split('/')
    .map((slug) =>
      Array.from(Buffer.from(slug, 'utf8'))
        .map((byte) => {
          const char = String.fromCharCode(byte);
          return /[\w-]/.test(char)
            ? char
            : `~${byte.toString(16).padStart(2, '0')}`;
        })
        .join(''),
    );
  return `${slugs.join('.')}.json`;
}

/**
 * Get the items of a listing, which is either an array or an object with
 * items.
 * @method getItems
 * @param {any} result Result of a listing endpoint.
 * @returns {Array} Items.
 */
export function getItems(result: any): any[] {
  return Array.isArray(result) ? result : result?.items || [];
}

/**
 * Call a batched listing endpoint page by page. Uses `batching.next` when
 * available and falls back to `b_start` when only `items_total` is returned.
 * Endpoints returning a plain array are treated as a single batch.
 * @method forEachBatch
 * @param {string} url Url of the listing, may already contain a query string.
 * @param {Function} fetch Function fetching an url and returning the json.
 * @param {Function} callback Function called with the items of each batch.
 * @param {number} size Batch size.
 * @returns {Promise<number>} Number of items.
 */
export async function forEachBatch(
  url: string,
  fetch: (url: string) => Promise<any>,
  callback: (items: any[]) => Promise<void> | void,
  size: number = 100,
): Promise<number> {
  const separator = url.includes('?') ? '&' : '?';
  let next: string | undefined = `${url}${separator}b_size=${size}&b_start=0`;
  let count = 0;

  while (next) {
    const result: any = await fetch(next);
    const items = getItems(result);
    await callback(items);
    count += items.length;

    if (Array.isArray(result) || items.length === 0) {
      next = undefined;
    } else if (result.batching) {
      next = result.batching.next;
    } else if (result.items_total && count < result.items_total) {
      next = `${url}${separator}b_size=${size}&b_start=${count}`;
    } else {
      next = undefined;
    }
  }
  return count;
}

/**
 * Fetch all items of a batched listing endpoint.
 * @method fetchAllBatches
 * @param {string} url Url of the listing.
 * @param {Function} fetch Function fetching an url and returning the json.
 * @param {number} size Batch size.
 * @returns {Promise<any[]>} All items.
 */
export async function fetchAllBatches(
  url: string,
  fetch: (url: string) => Promise<any>,
  size: number = 100,
): Promise<any[]> {
  const output: any[] = [];
  await forEachBatch(
    url,
    fetch,
    (items) => {
      output.push(...items);
    },
    size,
  );
  return output;
}

/**
 * Roles which exist in Nick's core profile.
 */
export const coreRoles = [
  'Anonymous',
  'Authenticated',
  'Owner',
  'Reader',
  'Contributor',
  'Editor',
  'Reviewer',
  'Administrator',
];

/**
 * Plone roles which map to a different Nick role. Plone's `Member` role is
 * given to every logged in user, which is `Authenticated` in Nick.
 */
export const roleMapping: Record<string, string> = {
  Manager: 'Administrator',
  'Site Administrator': 'Administrator',
  Member: 'Authenticated',
};

/**
 * Plone groups which are virtual and not exported.
 */
export const virtualGroups = ['AuthenticatedUsers'];

/**
 * Map a Plone role to a Nick role.
 * @method mapRole
 * @param {string} role Plone role.
 * @returns {string} Nick role.
 */
export function mapRole(role: string): string {
  return roleMapping[role] || role;
}

/**
 * Map Plone roles of a principal to Nick roles. `Anonymous` and
 * `Authenticated` are dropped, Nick adds them to every user.
 * @method mapPrincipalRoles
 * @param {string[]} roles Plone roles.
 * @returns {string[]} Nick roles.
 */
export function mapPrincipalRoles(roles: string[]): string[] {
  return [
    ...new Set(
      (roles || [])
        .map(mapRole)
        .filter((role) => !['Anonymous', 'Authenticated'].includes(role)),
    ),
  ];
}

/**
 * Get the roles which have to be added to Nick.
 * @method getCustomRoles
 * @param {Array} roles Roles of the Plone site.
 * @returns {Array} Roles not in Nick's core profile.
 */
export function getCustomRoles(roles: any[]): any[] {
  return roles.filter(
    (role) => !coreRoles.includes(role.id) && !(role.id in roleMapping),
  );
}

/**
 * Generate a random password. Password hashes can't be read over the REST
 * api, so every migrated user gets its own random password and has to reset
 * it.
 * @method generatePassword
 * @returns {string} Random password.
 */
export function generatePassword(): string {
  return randomBytes(24).toString('base64url');
}

/**
 * Convert users. Every user gets its own random password, except the user
 * running the export, which keeps the password used for the export. Users
 * which are referenced by content (owners, actors) but don't exist anymore
 * (or are not listed, like the Zope root user) are added without roles.
 * @method convertUserList
 * @param {Array} users Users from the `@users` endpoint.
 * @param {Object} login Login and password of the user running the export.
 * @param {string[]} principals Ids of users referenced by content.
 * @returns {Array} Users for the profile.
 */
export function convertUserList(
  users: any[],
  login: { login: string; password: string },
  principals: string[] = [],
): any[] {
  const output = users.map((user) => ({
    ...omit(user, ['@id', 'id', 'username', 'groups', 'roles', 'portrait']),
    id: user.username || user.id,
    password:
      (user.username || user.id) === login.login
        ? login.password
        : generatePassword(),
    fullname: user.fullname || '',
    email: user.email || undefined,
    roles: mapPrincipalRoles(user.roles),
    groups: (user.groups?.items || [])
      .map((group: any) => group.id)
      .filter((group: string) => !virtualGroups.includes(group)),
  }));
  const ids = output.map((user) => user.id);

  // Add the user running the export, for example the Zope root user
  if (!ids.includes(login.login)) {
    output.push({
      id: login.login,
      password: login.password,
      fullname: login.login,
      email: undefined,
      roles: ['Administrator'],
      groups: [],
    });
    ids.push(login.login);
  }

  // Add users referenced by content
  [...new Set(principals)]
    .filter((id) => id && !ids.includes(id) && id !== 'anonymous')
    .map((id) =>
      output.push({
        id,
        password: generatePassword(),
        fullname: id,
        email: undefined,
        roles: [],
        groups: [],
      }),
    );
  return output;
}

/**
 * Plone behaviors which map to a Nick behavior. Fields of other behaviors
 * are kept, because the exported schema contains all fields.
 */
export const behaviorMapping: Record<string, string> = {
  'plone.basic': 'basic',
  'plone.dublincore': 'dublin_core',
  'plone.categorization': 'categorization',
  'plone.publication': 'dates',
  'plone.ownership': 'ownership',
  'plone.excludefromnavigation': 'exclude_from_nav',
  'plone.shortname': 'short_name',
  'plone.namefromtitle': 'id_from_title',
  'plone.versioning': 'versioning',
  'plone.navigationroot': 'navigation_root',
  'volto.blocks': 'blocks',
  'volto.preview_image_link': 'preview_image_link',
};

/**
 * Convert the behaviors of a type.
 * @method convertBehaviors
 * @param {Object} data Data of the `@controlpanels/dexterity-types/<type>` endpoint.
 * @param {Object} options Is the type folderish or a navigation root.
 * @returns {string[]} Nick behaviors.
 */
export function convertBehaviors(
  data: Record<string, any>,
  options: { folderish?: boolean; navroot?: boolean } = {},
): string[] {
  const behaviors = Object.keys(data || {})
    .filter((key) => data[key] === true && key in behaviorMapping)
    .map((key) => behaviorMapping[key]);
  if (options.folderish) {
    behaviors.push('folderish');
  }
  if (options.navroot) {
    behaviors.push('navigation_root');
  }
  return [...new Set(behaviors)];
}

/**
 * Read the files of a tar archive (ustar, as written by GenericSetup).
 * @method parseTar
 * @param {Buffer} buffer Uncompressed tar archive.
 * @returns {Object} File contents by path.
 */
export function parseTar(buffer: Buffer): Record<string, string> {
  const files: Record<string, string> = {};
  const field = (offset: number, length: number) =>
    buffer
      .subarray(offset, offset + length)
      .toString('utf8')
      .replace(/\0.*$/s, '');
  let offset = 0;
  let longName = '';

  while (offset + 512 <= buffer.length) {
    const name = field(offset, 100);
    if (name === '') {
      break;
    }
    const size = parseInt(field(offset + 124, 12).trim() || '0', 8);
    const type = field(offset + 156, 1);
    const prefix = field(offset + 345, 155);
    const data = buffer.subarray(offset + 512, offset + 512 + size);
    if (type === 'L') {
      longName = data.toString('utf8').replace(/\0.*$/s, '');
    } else {
      const path = longName || (prefix ? `${prefix}/${name}` : name);
      if (type === '0' || type === '') {
        files[path] = data.toString('utf8');
      }
      longName = '';
    }
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return files;
}

/**
 * Get the state of a document of a type without workflow. Plone acquires
 * the permissions of the parent for those documents, so the state of the
 * nearest parent is used when the workflow of the type has that state, else
 * the initial state. The site root gets the state which grants `View` to
 * `Anonymous`.
 * @method getAcquiredState
 * @param {Object} workflow Nick workflow of the type.
 * @param {string} parentState State of the parent, undefined for the root.
 * @returns {string} State.
 */
export function getAcquiredState(workflow: any, parentState?: string): string {
  const states = workflow.json.states;
  if (parentState === undefined) {
    return (
      Object.keys(states).find((state) =>
        (states[state].permissions.Anonymous || []).includes('View'),
      ) || workflow.json.initial_state
    );
  }
  return parentState in states ? parentState : workflow.json.initial_state;
}

/**
 * Convert the workflow history of a document (the `history` of the
 * `@workflow` endpoint, oldest first) to Nick's workflow history. The
 * transition titles are taken from the workflow, the creation entry has no
 * action and the title `Create`. Other workflow variables of the entries
 * are kept.
 * @method convertWorkflowHistory
 * @param {Array} history Workflow history.
 * @param {Object} workflow Nick workflow of the document.
 * @returns {Array} Nick workflow history.
 */
export function convertWorkflowHistory(history: any[], workflow?: any): any[] {
  return (history || []).map((entry) => ({
    // Other workflow variables of the entry
    ...omit(entry, [
      'action',
      'actor',
      'comments',
      'review_state',
      'time',
      'title',
      'type',
    ]),
    action: entry.action || null,
    actor: typeof entry.actor === 'object' ? entry.actor?.id : entry.actor,
    comments: entry.comments || '',
    review_state: entry.review_state,
    state_title:
      entry.title ||
      workflow?.json.states[entry.review_state]?.title ||
      entry.review_state,
    time: entry.time,
    transition_title: entry.action
      ? workflow?.json.transitions[entry.action]?.title || entry.action
      : 'Create',
  }));
}

/**
 * Fields of the plone.restapi content serialization which are computed or
 * stored elsewhere in Nick.
 */
export const omitFields = [
  '@components',
  '@id',
  '@type',
  'UID',
  'creators',
  'items',
  'items_total',
  'is_folderish',
  'lock',
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
];

/**
 * Convert the versions of a document. Only `versioning` entries of the
 * `@history` endpoint are versions, workflow entries are exported with the
 * workflow history.
 * @method convertVersions
 * @param {Array} history Entries of the `@history` endpoint.
 * @param {Function} fetchVersion Function returning the json of a version.
 * @returns {Promise<Array>} Nick versions, oldest first.
 */
export async function convertVersions(
  history: any[],
  fetchVersion: (version: number) => Promise<any>,
): Promise<any[]> {
  const entries = (history || [])
    .filter((entry) => entry.type === 'versioning')
    .sort((a, b) => a.version - b.version);
  const versions: any[] = [];
  for (const entry of entries) {
    const json = await fetchVersion(entry.version);
    versions.push({
      ...omit(json, omitFields),
      version: entry.version,
      created: entry.time,
      actor: typeof entry.actor === 'object' ? entry.actor?.id : entry.actor,
      id: json.id,
      changeNote: entry.comments || '',
    });
  }
  return versions;
}

/**
 * Convert the local roles of a document (`@sharing` endpoint). Only roles
 * set on the document itself are exported, acquired and global roles are
 * not. Local roles of virtual groups (like `AuthenticatedUsers`) can't be
 * set in Nick and are skipped.
 * @method convertSharing
 * @param {Object} sharing Data of the `@sharing` endpoint.
 * @returns {Object} Sharing data and inherit flag of the document.
 */
export function convertSharing(sharing: any): {
  inherit_roles: boolean;
  sharing: { users: any[]; groups: any[] };
} {
  const principals = (type: string) =>
    (sharing?.entries || [])
      .filter(
        (entry: any) =>
          entry.type === type && !virtualGroups.includes(entry.id),
      )
      .map((entry: any) => ({
        id: entry.id,
        roles: [
          ...new Set(
            Object.keys(entry.roles || {})
              .filter((role) => entry.roles[role] === true)
              .map(mapRole),
          ),
        ],
      }))
      .filter((entry: any) => entry.roles.length > 0);
  return {
    inherit_roles: sharing?.inherit !== false,
    sharing: { users: principals('user'), groups: principals('group') },
  };
}

/**
 * Check if a field value is a file or image of the plone.restapi
 * serialization.
 * @method isBlob
 * @param {any} value Field value.
 * @returns {boolean} True if the value is a file or image.
 */
export function isBlob(value: any): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.download === 'string' &&
    'filename' in value &&
    'content-type' in value
  );
}

/**
 * Get the profile path of a blob, relative to the documents folder.
 * @method getBlobPath
 * @param {string} uuid Uuid of the document.
 * @param {string} field Name of the field.
 * @param {string} filename Filename of the blob.
 * @returns {string} Path of the blob.
 */
export function getBlobPath(
  uuid: string,
  field: string,
  filename: string,
): string {
  const name = (filename || field).replace(/[/\\\0]/g, '_');
  return `/blobs/${uuid}/${field}/${name}`;
}

/**
 * Download the files and images of a document into the profile. The field
 * values are replaced by a reference to the downloaded file with the
 * original filename and content type. File and image fields of versions
 * refer to the same file when they are unchanged; other versions of files
 * can't be downloaded over the REST api and are dropped.
 * @method exportBlobs
 * @param {Object} json Json data of the document.
 * @param {Array} versions Versions of the document.
 * @param {string} uuid Uuid of the document.
 * @param {Function} download Function downloading a field, returns the data.
 * @param {Function} write Function writing data to a profile path.
 * @returns {Promise<Object>} Json data and versions with file references.
 */
export async function exportBlobs(
  json: Record<string, any>,
  versions: any[],
  uuid: string,
  download: (field: string) => Promise<Buffer>,
  write: (path: string, data: Buffer) => void,
): Promise<{ json: Record<string, any>; versions: any[] }> {
  const output = { ...json };
  const fields = Object.keys(json).filter((field) => isBlob(json[field]));

  for (const field of fields) {
    const path = getBlobPath(uuid, field, json[field].filename);
    write(path, await download(field));
    output[field] = {
      path,
      filename: json[field].filename,
      'content-type': json[field]['content-type'],
    };
  }

  return {
    json: output,
    versions: versions.map((version) =>
      Object.fromEntries(
        Object.keys(version)
          .filter(
            (field) =>
              !isBlob(version[field]) ||
              (field in output &&
                version[field].filename === json[field]?.filename &&
                version[field].size === json[field]?.size),
          )
          .map((field) => [
            field,
            isBlob(version[field]) ? output[field] : version[field],
          ]),
      ),
    ),
  };
}

/**
 * Check if a value is a summary of a related document.
 * @method isRelation
 * @param {any} value Value.
 * @returns {boolean} True if the value is a summary with an uid.
 */
function isRelation(value: any): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.UID === 'string' &&
    typeof value['@id'] === 'string'
  );
}

/**
 * Convert relation fields. Relation lists (arrays of summaries) become
 * arrays of uuids, relation choices (a summary) become an array with one
 * summary, which is how Nick stores them. Plone uids are converted to uuids.
 * @method convertRelations
 * @param {Object} json Json data of a document.
 * @returns {Object} Json data with converted relations.
 */
export function convertRelations(json: Record<string, any>): any {
  return Object.fromEntries(
    Object.keys(json).map((field) => {
      const value = json[field];
      if (Array.isArray(value) && value.length > 0 && value.every(isRelation)) {
        return [field, value.map((item: any) => convertUid(item.UID))];
      }
      if (isRelation(value)) {
        return [
          field,
          [
            {
              '@id': value['@id'],
              UID: convertUid(value.UID),
              title: value.title,
            },
          ],
        ];
      }
      return [field, value];
    }),
  );
}

/**
 * Apply a function to all strings in a value.
 * @method mapStrings
 * @param {any} value Value to convert.
 * @param {Function} callback Function converting a string.
 * @returns {any} Converted value.
 */
export function mapStrings(
  value: any,
  callback: (value: string) => string,
): any {
  if (typeof value === 'string') {
    return callback(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => mapStrings(item, callback));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.keys(value).map((key) => [key, mapStrings(value[key], callback)]),
    );
  }
  return value;
}

/**
 * Make urls of the site relative to the site root, for example in links
 * and teasers in blocks: `http://host/plone/news` becomes `/news`.
 * @method relativizeUrls
 * @param {any} value Value to convert.
 * @param {string} baseUrl Url of the site root.
 * @returns {any} Converted value.
 */
export function relativizeUrls(value: any, baseUrl: string): any {
  return mapStrings(value, (text) =>
    text === baseUrl || text === `${baseUrl}/`
      ? '/'
      : text.split(`${baseUrl}/`).join('/'),
  );
}

/**
 * Convert the querystring operations of collections and listing blocks:
 * `plone.app.querystring.operation.selection.any` becomes `selection.any`.
 * @method convertQueryOperations
 * @param {any} value Value to convert.
 * @returns {any} Converted value.
 */
export function convertQueryOperations(value: any): any {
  return mapStrings(value, (text) =>
    text.startsWith('plone.app.querystring.operation.')
      ? text.substring('plone.app.querystring.operation.'.length)
      : text,
  );
}

/**
 * Get the translation group of a document. Plone doesn't expose its
 * translation group over the REST api, so a uuid is derived from the sorted
 * paths of the document and its translations, which is the same for all
 * documents of the group.
 * @method getTranslationGroup
 * @param {string} path Path of the document.
 * @param {Object} translations The `translations` component of the document.
 * @param {string} baseUrl Url of the site root.
 * @returns {string|undefined} Translation group, undefined without translations.
 */
export function getTranslationGroup(
  path: string,
  translations: any,
  baseUrl: string,
): string | undefined {
  const items = translations?.items || [];
  if (items.length === 0) {
    return undefined;
  }
  const paths = [
    path,
    ...items.map((item: any) => getDocumentPath(item['@id'], baseUrl)),
  ].sort();
  const hash = createHash('sha1').update(paths.join('\n')).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    `5${hash.substring(13, 16)}`,
    `${((parseInt(hash[16], 16) & 0x3) | 0x8).toString(16)}${hash.substring(17, 20)}`,
    hash.substring(20, 32),
  ].join('-');
}

/**
 * Convert redirects (`@aliases` of the site root). Redirects to documents
 * which are not exported are skipped.
 * @method convertRedirects
 * @param {Array} aliases Aliases.
 * @param {Map} uuids Uuids of the exported documents by path.
 * @returns {Array} Nick redirects.
 */
export function convertRedirects(
  aliases: any[],
  uuids: Map<string, string>,
): any[] {
  return aliases
    .filter((alias) => uuids.has(alias['redirect-to']))
    .map((alias) => ({
      document: uuids.get(alias['redirect-to']),
      path: alias.path,
      manual: alias.manual === true,
      datetime: alias.datetime,
    }));
}

/**
 * Convert the comments of a document (`@comments` endpoint) to the comments
 * Nick stores in the document.
 * @method convertComments
 * @param {Array} comments Comments.
 * @returns {Array} Nick comments.
 */
export function convertComments(comments: any[]): any[] {
  return (comments || []).map((comment) => ({
    id: comment.comment_id,
    parent: comment.in_reply_to || null,
    author: comment.author_username,
    created: comment.creation_date,
    modified: comment.modification_date,
    text: comment.text,
  }));
}

/**
 * Get the position of documents in their parent from a listing sorted on
 * position in parent: the position of a document is the number of its
 * siblings listed before it.
 * @method getPositions
 * @param {string[]} paths Paths sorted on position in parent.
 * @returns {Map} Positions by path.
 */
export function getPositions(paths: string[]): Map<string, number> {
  const counters = new Map<string, number>();
  const positions = new Map<string, number>();
  paths.map((path) => {
    const parent =
      path === '/' ? '' : path.substring(0, path.lastIndexOf('/')) || '/';
    const position = counters.get(parent) || 0;
    positions.set(path, position);
    counters.set(parent, position + 1);
  });
  return positions;
}

/**
 * Convert the site settings (`@site` endpoint) to the `site` and `language`
 * controlpanels.
 * @method convertSiteSettings
 * @param {Object} site Data of the `@site` endpoint.
 * @returns {Array} Controlpanels.
 */
export function convertSiteSettings(site: any): any[] {
  return [
    {
      id: 'site',
      data: {
        site_title: site['plone.site_title'],
        robots_txt: site['plone.robots_txt'],
      },
    },
    {
      id: 'language',
      data: {
        default_language: site['plone.default_language'],
        available_languages: site['plone.available_languages'],
        multilingual: site.features?.multilingual === true,
      },
    },
  ];
}
