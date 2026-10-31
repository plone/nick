/**
 * Export helper tests.
 * @module helpers/export/export.test
 */

// External imports
import { describe, it, expect } from 'vitest';

// Internal imports
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
  convertWorkflow,
  convertWorkflowHistory,
  exportBlobs,
  fetchAllBatches,
  forEachBatch,
  generatePassword,
  getAcquiredState,
  getCustomRoles,
  getDocumentFilename,
  getDocumentPath,
  getItems,
  getPositions,
  getTranslationGroup,
  mapPrincipalRoles,
  parseTar,
  relativizeUrls,
} from './export';

/**
 * Fake batched endpoint.
 * @param {number} total Number of items.
 * @param {boolean} batching Return batching links.
 * @returns {Object} Fetch function and requested urls.
 */
const batchedEndpoint = (total: number, batching: boolean) => {
  const urls: string[] = [];
  const fetch = async (url: string) => {
    urls.push(url);
    const params = new URL(url).searchParams;
    const start = parseInt(params.get('b_start') || '0');
    const size = parseInt(params.get('b_size') || '25');
    const items = Array.from(
      { length: Math.max(0, Math.min(size, total - start)) },
      (_value, index) => ({ id: start + index }),
    );
    return {
      items,
      items_total: total,
      ...(batching && start + size < total
        ? {
            batching: {
              next: `http://host/@search?sort_on=path&b_size=${size}&b_start=${start + size}`,
            },
          }
        : {}),
    };
  };
  return { fetch, urls };
};

describe('export', () => {
  describe('getDocumentPath', () => {
    it('returns the root path for the site url', () => {
      expect(getDocumentPath('http://host/plone', 'http://host/plone')).toBe(
        '/',
      );
    });

    it('returns the decoded path of a document', () => {
      expect(
        getDocumentPath(
          'http://host/plone/news/my%20item',
          'http://host/plone',
        ),
      ).toBe('/news/my item');
    });
  });

  describe('getDocumentFilename', () => {
    it('returns _root.json for the root', () => {
      expect(getDocumentFilename('/')).toBe('_root.json');
    });

    it('separates path segments with dots', () => {
      expect(getDocumentFilename('/news/item-1')).toBe('news.item-1.json');
    });

    it('escapes dots and other characters in ids', () => {
      expect(getDocumentFilename('/files/report.pdf')).toBe(
        'files.report~2epdf.json',
      );
      expect(getDocumentFilename('/über uns')).toBe('~c3~bcber~20uns.json');
    });

    it('keeps parents before children when sorted', () => {
      const files = ['/a.b/c', '/a-b', '/a.b', '/a']
        .map((path) => getDocumentFilename(path).replace(/\.json$/, ''))
        .sort();
      expect(files.indexOf('a~2eb')).toBeLessThan(files.indexOf('a~2eb.c'));
    });
  });

  describe('forEachBatch', () => {
    it('follows the batching links', async () => {
      const { fetch, urls } = batchedEndpoint(250, true);
      const sizes: number[] = [];
      const count = await forEachBatch(
        'http://host/@search?sort_on=path',
        fetch,
        (items) => {
          sizes.push(items.length);
        },
        100,
      );
      expect(count).toBe(250);
      expect(sizes).toEqual([100, 100, 50]);
      expect(urls[0]).toBe(
        'http://host/@search?sort_on=path&b_size=100&b_start=0',
      );
    });

    it('falls back to items_total without batching links', async () => {
      const { fetch, urls } = batchedEndpoint(120, false);
      const items = await fetchAllBatches('http://host/@users', fetch, 50);
      expect(items.map((item: any) => item.id)).toEqual(
        Array.from({ length: 120 }, (_value, index) => index),
      );
      expect(urls).toHaveLength(3);
    });

    it('treats an array as a single batch', async () => {
      const items = await fetchAllBatches('http://host/@groups', async () => [
        { id: 'a' },
        { id: 'b' },
      ]);
      expect(items).toEqual([{ id: 'a' }, { id: 'b' }]);
    });
  });

  describe('mapPrincipalRoles', () => {
    it('maps Plone roles to Nick roles', () => {
      expect(
        mapPrincipalRoles([
          'Manager',
          'Site Administrator',
          'Member',
          'Authenticated',
          'Reviewer',
          'Custom',
        ]),
      ).toEqual(['Administrator', 'Reviewer', 'Custom']);
    });
  });

  describe('getCustomRoles', () => {
    it('returns only roles missing in Nick', () => {
      expect(
        getCustomRoles([
          { id: 'Manager' },
          { id: 'Member' },
          { id: 'Editor' },
          { id: 'Site Administrator' },
          { id: 'Custom' },
        ]),
      ).toEqual([{ id: 'Custom' }]);
    });
  });

  describe('generatePassword', () => {
    it('returns a different password every time', () => {
      expect(generatePassword()).not.toBe(generatePassword());
      expect(generatePassword().length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('convertUserList', () => {
    const users = [
      {
        '@id': 'http://host/plone/@users/jane',
        id: 'jane',
        username: 'jane',
        fullname: 'Jane Doe',
        email: 'jane@example.org',
        location: 'Oslo',
        roles: ['Member', 'Reviewer'],
        groups: {
          items: [{ id: 'AuthenticatedUsers' }, { id: 'staff' }],
        },
      },
      {
        id: 'john',
        username: 'john',
        fullname: 'John Doe',
        email: 'john@example.org',
        roles: ['Member'],
        groups: { items: [] },
      },
    ];

    it('gives every user its own password', () => {
      const output = convertUserList(users, {
        login: 'admin',
        password: 'secret',
      });
      expect(output[0].password).not.toBe(output[1].password);
      expect(output[0]).toMatchObject({
        id: 'jane',
        fullname: 'Jane Doe',
        email: 'jane@example.org',
        location: 'Oslo',
        roles: ['Reviewer'],
        groups: ['staff'],
      });
    });

    it('adds the user running the export with its password', () => {
      const output = convertUserList(users, {
        login: 'admin',
        password: 'secret',
      });
      expect(output[2]).toMatchObject({
        id: 'admin',
        password: 'secret',
        roles: ['Administrator'],
      });
    });

    it('adds users referenced by content without roles', () => {
      const output = convertUserList(
        users,
        { login: 'jane', password: 'secret' },
        ['jane', 'removed', 'removed', 'anonymous'],
      );
      expect(output.map((user: any) => user.id)).toEqual([
        'jane',
        'john',
        'removed',
      ]);
      expect(output[0].password).toBe('secret');
      expect(output[2].roles).toEqual([]);
    });
  });

  describe('getItems', () => {
    it('returns the items of a listing', () => {
      expect(getItems([{ id: 'a' }])).toEqual([{ id: 'a' }]);
      expect(getItems({ items: [{ id: 'b' }] })).toEqual([{ id: 'b' }]);
      expect(getItems({ message: 'error' })).toEqual([]);
    });
  });

  describe('convertBehaviors', () => {
    it('maps enabled Plone behaviors to Nick behaviors', () => {
      expect(
        convertBehaviors({
          'plone.dublincore': true,
          'plone.versioning': true,
          'plone.locking': true,
          'volto.blocks': true,
          'plone.shortname': false,
          title: 'Page',
        }),
      ).toEqual(['dublin_core', 'versioning', 'blocks']);
    });

    it('adds folderish and navigation root', () => {
      expect(
        convertBehaviors(
          { 'plone.navigationroot': true },
          { folderish: true, navroot: true },
        ),
      ).toEqual(['navigation_root', 'folderish']);
    });
  });

  describe('parseTar', () => {
    it('reads the files of a tar archive', () => {
      const header = (name: string, size: number) => {
        const block = Buffer.alloc(512);
        block.write(name, 0);
        block.write(`${size.toString(8).padStart(11, '0')}\0`, 124);
        block.write('0', 156);
        return block;
      };
      const content = Buffer.from('<object/>');
      const archive = Buffer.concat([
        header('workflows.xml', content.length),
        content,
        Buffer.alloc(512 - content.length),
        Buffer.alloc(1024),
      ]);
      expect(parseTar(archive)).toEqual({ 'workflows.xml': '<object/>' });
    });
  });

  describe('getAcquiredState', () => {
    it('gets the state of documents without workflow', () => {
      const workflow =
        convertWorkflow(`<dc-workflow workflow_id="w" initial_state="internal">
 <state state_id="internal"><permission-map name="View"><permission-role>Member</permission-role></permission-map></state>
 <state state_id="external"><permission-map name="View"><permission-role>Anonymous</permission-role></permission-map></state>
</dc-workflow>`);
      expect(getAcquiredState(workflow)).toBe('external');
      expect(getAcquiredState(workflow, 'external')).toBe('external');
      expect(getAcquiredState(workflow, 'unknown')).toBe('internal');
    });
  });

  describe('convertWorkflowHistory', () => {
    it('keeps the other workflow variables', () => {
      expect(
        convertWorkflowHistory([
          {
            action: 'submit',
            actor: { id: 'jane' },
            comments: '',
            review_state: 'pending',
            time: '2026-01-01T10:00:00+00:00',
            title: 'Pending',
            reviewer: 'john',
          },
        ])[0],
      ).toEqual({
        action: 'submit',
        actor: 'jane',
        comments: '',
        review_state: 'pending',
        reviewer: 'john',
        state_title: 'Pending',
        time: '2026-01-01T10:00:00+00:00',
        transition_title: 'submit',
      });
    });

    it('converts the workflow history with titles and comments', () => {
      const workflow = {
        json: {
          states: { private: { title: 'Private' } },
          transitions: { publish: { title: 'Publish' } },
        },
      };
      expect(
        convertWorkflowHistory(
          [
            {
              action: null,
              actor: 'jane',
              comments: '',
              review_state: 'private',
              time: '2026-01-01T10:00:00+00:00',
              title: 'Private',
            },
            {
              action: 'publish',
              actor: 'john',
              comments: 'Approved',
              review_state: 'published',
              time: '2026-01-02T10:00:00+00:00',
              title: 'Published',
            },
          ],
          workflow,
        ),
      ).toEqual([
        {
          action: null,
          actor: 'jane',
          comments: '',
          review_state: 'private',
          state_title: 'Private',
          time: '2026-01-01T10:00:00+00:00',
          transition_title: 'Create',
        },
        {
          action: 'publish',
          actor: 'john',
          comments: 'Approved',
          review_state: 'published',
          state_title: 'Published',
          time: '2026-01-02T10:00:00+00:00',
          transition_title: 'Publish',
        },
      ]);
    });
  });

  describe('convertVersions', () => {
    it('converts the versions of the history', async () => {
      const versions = await convertVersions(
        [
          {
            type: 'workflow',
            action: 'publish',
            time: '2026-01-03T10:00:00+00:00',
          },
          {
            type: 'versioning',
            version: 1,
            actor: { id: 'john' },
            comments: 'Changed title',
            time: '2026-01-02T10:00:00+00:00',
          },
          {
            type: 'versioning',
            version: 0,
            actor: { id: 'jane' },
            comments: 'Initial version',
            time: '2026-01-01T10:00:00+00:00',
          },
        ],
        async (version: number) => ({
          '@id': 'http://host/plone/page',
          '@type': 'Document',
          UID: 'abc',
          id: 'page',
          title: `Title ${version}`,
          review_state: 'published',
        }),
      );
      expect(versions).toEqual([
        {
          version: 0,
          created: '2026-01-01T10:00:00+00:00',
          actor: 'jane',
          id: 'page',
          title: 'Title 0',
          changeNote: 'Initial version',
        },
        {
          version: 1,
          created: '2026-01-02T10:00:00+00:00',
          actor: 'john',
          id: 'page',
          title: 'Title 1',
          changeNote: 'Changed title',
        },
      ]);
    });
  });

  describe('convertSharing', () => {
    it('converts local roles and the inherit flag', () => {
      expect(
        convertSharing({
          inherit: false,
          entries: [
            {
              id: 'AuthenticatedUsers',
              type: 'group',
              roles: { Reader: true },
            },
            {
              id: 'staff',
              type: 'group',
              roles: { Reader: true, Editor: 'acquired', Reviewer: false },
            },
            {
              id: 'jane',
              type: 'user',
              roles: {
                Editor: true,
                Reviewer: 'global',
                'Site Administrator': true,
              },
            },
            { id: 'john', type: 'user', roles: { Reader: 'acquired' } },
          ],
        }),
      ).toEqual({
        inherit_roles: false,
        sharing: {
          users: [{ id: 'jane', roles: ['Editor', 'Administrator'] }],
          groups: [{ id: 'staff', roles: ['Reader'] }],
        },
      });
    });

    it('inherits roles by default', () => {
      expect(convertSharing({ entries: [] }).inherit_roles).toBe(true);
    });
  });

  describe('exportBlobs', () => {
    it('downloads blobs and references them from the document and versions', async () => {
      const written: Record<string, string> = {};
      const file = {
        'content-type': 'text/csv',
        download: 'http://host/plone/data.csv/@@download/file',
        filename: 'data.csv',
        size: 5,
      };
      const { json, versions } = await exportBlobs(
        { title: 'Data', file },
        [
          { version: 0, title: 'Old', file: { ...file, size: 3 } },
          { version: 1, title: 'Data', file },
        ],
        'uuid-1',
        async (field: string) => Buffer.from(`${field}!`),
        (path: string, data: Buffer) => {
          written[path] = data.toString();
        },
      );
      const reference = {
        path: '/blobs/uuid-1/file/data.csv',
        filename: 'data.csv',
        'content-type': 'text/csv',
      };
      expect(written).toEqual({ '/blobs/uuid-1/file/data.csv': 'file!' });
      expect(json).toEqual({ title: 'Data', file: reference });
      expect(versions).toEqual([
        { version: 0, title: 'Old' },
        { version: 1, title: 'Data', file: reference },
      ]);
    });
  });

  describe('convertUid', () => {
    it('converts a Plone uid to a uuid', () => {
      expect(convertUid('c85657a660db4199a181c594d95e65de')).toBe(
        'c85657a6-60db-4199-a181-c594d95e65de',
      );
    });
  });

  describe('convertRelations', () => {
    it('converts relation lists and relation choices', () => {
      expect(
        convertRelations({
          title: 'Team',
          relatedItems: [
            {
              '@id': 'http://host/plone/history',
              UID: '8d00cf7b5bd84e479a8f1dc64e68aa61',
              title: 'History',
            },
          ],
          preview_image_link: {
            '@id': 'http://host/plone/logo.png',
            UID: 'c85657a660db4199a181c594d95e65de',
            title: 'Logo',
          },
          subjects: ['a'],
          empty: [],
        }),
      ).toEqual({
        title: 'Team',
        relatedItems: ['8d00cf7b-5bd8-4e47-9a8f-1dc64e68aa61'],
        preview_image_link: [
          {
            '@id': 'http://host/plone/logo.png',
            UID: 'c85657a6-60db-4199-a181-c594d95e65de',
            title: 'Logo',
          },
        ],
        subjects: ['a'],
        empty: [],
      });
    });
  });

  describe('relativizeUrls', () => {
    it('makes urls of the site relative to the site root', () => {
      expect(
        relativizeUrls(
          {
            url: 'http://host/plone/files/report.pdf',
            root: 'http://host/plone',
            other: 'http://host/plone2/page',
            text: 'See http://host/plone/news and http://example.org.',
            href: [{ '@id': 'http://host/plone/news' }],
            count: 3,
          },
          'http://host/plone',
        ),
      ).toEqual({
        url: '/files/report.pdf',
        root: '/',
        other: 'http://host/plone2/page',
        text: 'See /news and http://example.org.',
        href: [{ '@id': '/news' }],
        count: 3,
      });
    });
  });

  describe('getTranslationGroup', () => {
    it('returns the same uuid for all translations', () => {
      const en = getTranslationGroup(
        '/en/about',
        {
          items: [{ '@id': 'http://host/plone/de/ueber-uns', language: 'de' }],
        },
        'http://host/plone',
      );
      const de = getTranslationGroup(
        '/de/ueber-uns',
        { items: [{ '@id': 'http://host/plone/en/about', language: 'en' }] },
        'http://host/plone',
      );
      expect(en).toBe(de);
      expect(en).toMatch(
        /^[\da-f]{8}-[\da-f]{4}-5[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/,
      );
    });

    it('returns undefined without translations', () => {
      expect(
        getTranslationGroup('/en/about', { items: [] }, 'http://host/plone'),
      ).toBeUndefined();
      expect(
        getTranslationGroup('/en/about', undefined, 'http://host/plone'),
      ).toBeUndefined();
    });
  });

  describe('convertRedirects', () => {
    it('converts aliases to redirects of exported documents', () => {
      expect(
        convertRedirects(
          [
            {
              path: '/en/about-us',
              'redirect-to': '/en/about',
              manual: true,
              datetime: '2026-01-01T10:00:00+00:00',
            },
            {
              path: '/old',
              'redirect-to': '/removed',
              manual: false,
              datetime: '2026-01-01T10:00:00+00:00',
            },
          ],
          new Map([['/en/about', 'uuid-1']]),
        ),
      ).toEqual([
        {
          document: 'uuid-1',
          path: '/en/about-us',
          manual: true,
          datetime: '2026-01-01T10:00:00+00:00',
        },
      ]);
    });
  });

  describe('convertComments', () => {
    it('converts comments and replies', () => {
      expect(
        convertComments([
          {
            comment_id: '1',
            in_reply_to: null,
            author_username: 'jane',
            creation_date: '2026-01-01T10:00:00+00:00',
            modification_date: '2026-01-01T10:00:00+00:00',
            text: { data: 'Hello', 'mime-type': 'text/plain' },
          },
          {
            comment_id: '2',
            in_reply_to: '1',
            author_username: 'john',
            creation_date: '2026-01-02T10:00:00+00:00',
            modification_date: '2026-01-03T10:00:00+00:00',
            text: { data: 'Hi', 'mime-type': 'text/plain' },
          },
        ]),
      ).toEqual([
        {
          id: '1',
          parent: null,
          author: 'jane',
          created: '2026-01-01T10:00:00+00:00',
          modified: '2026-01-01T10:00:00+00:00',
          text: { data: 'Hello', 'mime-type': 'text/plain' },
        },
        {
          id: '2',
          parent: '1',
          author: 'john',
          created: '2026-01-02T10:00:00+00:00',
          modified: '2026-01-03T10:00:00+00:00',
          text: { data: 'Hi', 'mime-type': 'text/plain' },
        },
      ]);
    });
  });

  describe('getPositions', () => {
    it('counts the position within each parent', () => {
      const positions = getPositions(['/', '/b', '/b/z', '/a', '/b/y', '/c']);
      expect(Object.fromEntries(positions)).toEqual({
        '/': 0,
        '/b': 0,
        '/b/z': 0,
        '/a': 1,
        '/b/y': 1,
        '/c': 2,
      });
    });
  });

  describe('convertSiteSettings', () => {
    it('converts the site and language settings', () => {
      expect(
        convertSiteSettings({
          features: { multilingual: true },
          'plone.site_title': 'Intranet',
          'plone.robots_txt': 'User-agent: *',
          'plone.available_languages': ['en', 'de'],
          'plone.default_language': 'en',
        }),
      ).toEqual([
        {
          id: 'site',
          data: { site_title: 'Intranet', robots_txt: 'User-agent: *' },
        },
        {
          id: 'language',
          data: {
            default_language: 'en',
            available_languages: ['en', 'de'],
            multilingual: true,
          },
        },
      ]);
    });
  });

  describe('convertQueryOperations', () => {
    it('strips the plone.app.querystring prefix of operations', () => {
      expect(
        convertQueryOperations({
          blocks: {
            a: {
              '@type': 'listing',
              querystring: {
                query: [
                  {
                    i: 'portal_type',
                    o: 'plone.app.querystring.operation.selection.any',
                    v: ['News Item'],
                  },
                ],
              },
            },
          },
        }),
      ).toEqual({
        blocks: {
          a: {
            '@type': 'listing',
            querystring: {
              query: [
                { i: 'portal_type', o: 'selection.any', v: ['News Item'] },
              ],
            },
          },
        },
      });
    });
  });
});
