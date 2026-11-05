/**
 * Document model tests.
 * @module models/document/document.test
 */

// External imports
import { describe, it, expect, vi } from 'vitest';

// Internal imports
import '../../app';
import { isDuplicateIdError } from '../../helpers/error/error';
import { createDocument } from '../../helpers/tests/tests';
import {
  down as dropUniqueIds,
  findDuplicates,
  up as uniqueIds,
} from '../../migrations/202610210900_document_unique_id';
import models from '../../models';

describe('Document', () => {
  describe('unique ids', () => {
    it('should refuse a second document with the same id in a folder', async () => {
      const Document = models.get('Document');
      const news = await Document.fetchOne({ path: '/news' }, {}, global.txn!);
      await createDocument(
        '0123abcd-0000-4000-8000-000000000501',
        news,
        'twin',
        'Page',
      );
      const error = await global
        .txn!.raw('SAVEPOINT twin')
        .then(() =>
          createDocument(
            '0123abcd-0000-4000-8000-000000000502',
            news,
            'twin',
            'Page',
          ),
        )
        .then(
          () => undefined,
          (err: any) => err,
        );
      await global.txn!.raw('ROLLBACK TO SAVEPOINT twin');
      expect(isDuplicateIdError(error)).toBe(true);

      // A document in the recycle bin doesn't block its id
      await global.txn!('document')
        .where({ uuid: '0123abcd-0000-4000-8000-000000000501' })
        .update({ deleted: true });
      await createDocument(
        '0123abcd-0000-4000-8000-000000000503',
        news,
        'twin',
        'Page',
      );
    });

    it('should check for duplicates before adding the constraint', async () => {
      const Document = models.get('Document');
      const trx = global.txn!;
      const news = await Document.fetchOne({ path: '/news' }, {}, trx);
      await dropUniqueIds(trx);
      for (const uuid of ['505', '506']) {
        await createDocument(
          `0123abcd-0000-4000-8000-000000000${uuid}`,
          news,
          'twin',
          'Page',
        );
      }
      expect(await findDuplicates(trx)).toEqual([
        { parent: '/news', id: 'twin', count: 2 },
      ]);
      await trx.raw('SAVEPOINT migrate');
      await expect(uniqueIds(trx)).rejects.toThrow(
        '1 ids are used more than once in a folder',
      );
      await trx.raw('ROLLBACK TO SAVEPOINT migrate');
      await trx('document')
        .where({ uuid: '0123abcd-0000-4000-8000-000000000506' })
        .delete();
      await uniqueIds(trx);
    });
  });

  describe('allowedUsersGroupsRoles', () => {
    it('includes local roles and the owner with view in the workflow state', async () => {
      const Document = models.get('Document');
      const User = models.get('User');
      const root = await Document.fetchOne({ path: '/' }, {}, global.txn!);
      await User.create(
        { id: 'jane', fullname: 'Jane', password: 'secret' },
        {},
        global.txn!,
      );
      await User.create(
        { id: 'john', fullname: 'John', password: 'secret' },
        {},
        global.txn!,
      );
      const document: any = await Document.create(
        {
          uuid: '9a6b7c1e-2c6a-4f7e-9b1a-3f0d4a2c1e10',
          parent: root.uuid,
          id: 'private-page',
          path: '/private-page',
          position_in_parent: 99,
          version: 0,
          owner: 'jane',
          type: 'Page',
          workflow_state: 'private',
          workflow_history: JSON.stringify([]),
          lock: { locked: false, stealable: true },
          json: { title: 'Private page' },
        },
        {},
        global.txn!,
      );
      await document
        .$relatedQuery('_userRoles', global.txn!)
        .relate({ id: 'Editor', user: 'john' });
      await document.fetchRelated('_type._workflow', global.txn!);

      const allowed = await document.allowedUsersGroupsRoles(global.txn!);

      // Local Editor has View in the private state
      expect(allowed).toContain('user:john');
      // The owner has View in the core workflow private state
      expect(allowed).toContain('user:jane');

      // Owner without View in the private state
      delete document._type._workflow.json.states.private.permissions.Owner;
      expect(await document.allowedUsersGroupsRoles(global.txn!)).not.toContain(
        'user:jane',
      );
    });
  });

  describe('getAllowed', () => {
    it('does not depend on the order of the local roles', () => {
      const Document = models.get('Document');
      const roles = [
        { principal: 'user:john', role: 'Editor' },
        { principal: 'group:staff', role: 'Reader' },
        { principal: 'user:anna', role: 'Reader' },
        { principal: 'user:carl', role: 'Owner' },
      ];
      const allowed = Document.getAllowed(['Reader', 'Editor'], roles, 'jane');
      expect(allowed).toEqual([
        'Reader',
        'Editor',
        'group:staff',
        'user:anna',
        'user:john',
      ]);
      expect(
        Document.getAllowed(['Reader', 'Editor'], roles.reverse(), 'jane'),
      ).toEqual(allowed);
    });
  });

  describe('fetchAllRestricted', () => {
    it('does not match a user or group named like a role', async () => {
      const Catalog = models.get('Catalog');
      const Document = models.get('Document');
      const news = await Document.fetchOne({ path: '/news' }, {}, global.txn!);
      await news.fetchRelated('_type._workflow', global.txn!);
      await news.update({ workflow_state: 'private' }, global.txn!);
      news.workflow_state = 'private';
      await news.reindex(global.txn!);

      const req: any = {
        user: {
          id: 'Editor',
          _groups: [{ id: 'Administrator' }],
          getRoles: () => ['Authenticated'],
        },
      };
      const items = await Catalog.fetchAllRestricted(
        { _path: '/news' },
        {},
        global.txn!,
        req,
      );
      expect(items.getLength()).toBe(0);

      req.user.getRoles = () => ['Authenticated', 'Editor'];
      const allowed = await Catalog.fetchAllRestricted(
        { _path: '/news' },
        {},
        global.txn!,
        req,
      );
      expect(allowed.getLength()).toBe(1);
    });
  });

  describe('lockForUpdate', () => {
    it('reloads the document', async () => {
      const Document = models.get('Document');
      const news = await Document.fetchOne({ path: '/news' }, {}, global.txn!);
      await global.txn!('document')
        .where({ uuid: news.uuid })
        .update({ version: 7 });
      expect(news.version).not.toBe(7);
      await news.lockForUpdate(global.txn!);
      expect(news.version).toBe(7);
    });
  });

  describe('replacePath', () => {
    it('only changes the document and the documents below it', async () => {
      const Document = models.get('Document');
      const root = await Document.fetchOne({ path: '/' }, {}, global.txn!);
      const folder = await createDocument(
        'c2000000-0000-4000-8000-000000000001',
        root,
        'scale',
        'Folder',
      );
      await createDocument(
        'c2000000-0000-4000-8000-000000000002',
        folder,
        'child',
        'Page',
      );
      await createDocument(
        'c2000000-0000-4000-8000-000000000003',
        root,
        'scale-sibling',
        'Page',
      );
      await createDocument(
        'c2000000-0000-4000-8000-000000000004',
        root,
        'scalex',
        'Page',
      );

      await Document.replacePath('/scale', '/moved', global.txn!);

      const paths = async (table: string, column: string) =>
        (
          await global.txn!(table)
            .select(column)
            .where(column, 'like', '/%scale%')
            .orWhere(column, 'like', '/moved%')
        )
          .map((row: any) => row[column])
          .sort();
      expect(await paths('document', 'path')).toEqual([
        '/moved/child',
        '/scale',
        '/scale-sibling',
        '/scalex',
      ]);
      expect(await paths('catalog', '_path')).toEqual([
        '/moved/child',
        '/scale',
        '/scale-sibling',
        '/scalex',
      ]);
      expect(await paths('catalog', 'path')).toEqual([
        '/moved/child',
        '/scale',
        '/scale-sibling',
        '/scalex',
      ]);
      expect(await paths('redirect', 'path')).toEqual([
        '/scale',
        '/scale/child',
      ]);
    });

    it('handles quotes and like wildcards in paths', async () => {
      const Document = models.get('Document');
      const root = await Document.fetchOne({ path: '/' }, {}, global.txn!);
      const folder = await createDocument(
        'c2000000-0000-4000-8000-000000000005',
        root,
        "it's_100%",
        'Folder',
      );
      await createDocument(
        'c2000000-0000-4000-8000-000000000006',
        folder,
        'child',
        'Page',
      );
      await createDocument(
        'c2000000-0000-4000-8000-000000000007',
        root,
        "it's-1000",
        'Folder',
      );

      await Document.replacePath("/it's_100%", '/moved', global.txn!);

      const child = await Document.fetchById(
        'c2000000-0000-4000-8000-000000000006',
        {},
        global.txn!,
      );
      expect(child.path).toBe('/moved/child');
      const sibling = await Document.fetchById(
        'c2000000-0000-4000-8000-000000000007',
        {},
        global.txn!,
      );
      expect(sibling.path).toBe("/it's-1000");
    });
  });

  describe('traverse', () => {
    const uuid = (n: number) => `c2000000-0000-4000-8000-00000000010${n}`;

    /**
     * Create /t1/t2/t3/t4 with local roles for jane: Editor on t2 (blocked
     * on t3) and Reader on t4, and Contributor for her group on t1.
     * @returns {Promise<Object>} Root and user.
     */
    const setup = async () => {
      const Document = models.get('Document');
      const User = models.get('User');
      const root = await Document.fetchOne({ path: '/' }, {}, global.txn!);
      await User.create(
        { id: 'jane', fullname: 'Jane', password: 'secret' },
        {},
        global.txn!,
      );
      await global.txn!('group').insert({ id: 'janes', title: 'Janes' });
      await global.txn!('user_group').insert({ user: 'jane', group: 'janes' });
      let parent = root;
      for (const n of [1, 2, 3, 4]) {
        parent = await createDocument(uuid(n), parent, `t${n}`, 'Folder', {
          inherit_roles: n !== 3,
        });
      }
      await global.txn!('user_role_document').insert([
        { user: 'jane', role: 'Editor', document: uuid(2) },
        { user: 'jane', role: 'Reader', document: uuid(4) },
      ]);
      await global.txn!('group_role_document').insert({
        group: 'janes',
        role: 'Contributor',
        document: uuid(1),
      });
      const user = await User.fetchById(
        'jane',
        { related: '[_roles, _groups._roles]' },
        global.txn!,
      );
      return { Document, root, user };
    };

    it('merges the local roles along the path', async () => {
      const { root, user } = await setup();
      const two = await root.traverse(
        ['t1', 't2'],
        user,
        undefined,
        root,
        global.txn!,
      );
      expect(two.document.uuid).toBe(uuid(2));
      expect(two.localRoles.sort()).toEqual(['Contributor', 'Editor']);
      expect(two.document._type.id).toBe('Folder');

      const four = await root.traverse(
        ['t1', 't2', 't3', 't4'],
        user,
        undefined,
        root,
        global.txn!,
      );
      expect(four.document.uuid).toBe(uuid(4));
      expect(four.localRoles).toEqual(['Reader']);
      expect(four.navroot.uuid).toBe(root.uuid);

      expect(
        await root.traverse(['t1', 'nope'], user, [], root, global.txn!),
      ).toBe(false);
    });

    it('fetches the documents with one query for any depth', async () => {
      const { Document, root, user } = await setup();
      const fetchOne = vi.spyOn(Document, 'fetchOne');
      const query = vi.spyOn(Document, 'query');
      const result = await root.traverse(
        ['t1', 't2', 't3', 't4'],
        user,
        undefined,
        root,
        global.txn!,
      );
      expect(result.document.uuid).toBe(uuid(4));
      expect(fetchOne).not.toHaveBeenCalled();
      expect(query).toHaveBeenCalledTimes(1);
      fetchOne.mockRestore();
      query.mockRestore();
    });

    it('fetches the root with the documents along the path', async () => {
      const { Document, user } = await setup();
      const query = vi.spyOn(Document, 'query');
      const result = await Document.traverseFromRoot(
        ['t1', 't2'],
        user,
        global.txn!,
      );
      expect(result.document.uuid).toBe(uuid(2));
      expect(result.navroot.path).toBe('/');
      expect(result.localRoles.sort()).toEqual(['Contributor', 'Editor']);
      expect(query).toHaveBeenCalledTimes(1);
      query.mockRestore();

      const root = await Document.traverseFromRoot([], user, global.txn!);
      expect(root.document.path).toBe('/');
    });

    it('falls back to parent and id when a path is out of date', async () => {
      const { root, user } = await setup();
      await global.txn!('document')
        .where({ uuid: uuid(3) })
        .update({ path: '/stale' });
      const result = await root.traverse(
        ['t1', 't2', 't3', 't4'],
        user,
        undefined,
        root,
        global.txn!,
      );
      expect(result.document.uuid).toBe(uuid(4));
    });
  });

  describe('restrictChildren', () => {
    it('does not query the catalog without children', async () => {
      const Catalog = models.get('Catalog');
      const Document = models.get('Document');
      const root = await Document.fetchOne({ path: '/' }, {}, global.txn!);
      const leaf = await createDocument(
        'c2000000-0000-4000-8000-000000000311',
        root,
        'leaf',
        'Page',
      );
      await leaf.fetchChildren({}, global.txn!);
      const restricted = vi.spyOn(Catalog, 'fetchAllRestricted');
      await leaf.restrictChildren({} as any, global.txn!);
      expect(leaf._restrictedChildren).toEqual([]);
      expect(restricted).not.toHaveBeenCalled();
      restricted.mockRestore();
    });

    it('keeps the viewable children in their order', async () => {
      const Document = models.get('Document');
      const root = await Document.fetchOne({ path: '/' }, {}, global.txn!);
      const folder = await createDocument(
        'c2000000-0000-4000-8000-000000000301',
        root,
        'restrict',
        'Folder',
        { workflow_state: 'published' },
      );
      for (const [n, state] of [
        [2, 'published'],
        [3, 'private'],
        [4, 'published'],
      ]) {
        await createDocument(
          `c2000000-0000-4000-8000-00000000030${n}`,
          folder,
          `child-${n}`,
          'Page',
          { workflow_state: state, position_in_parent: 10 - (n as number) },
        );
      }
      await folder.fetchChildren({}, global.txn!);
      const req: any = {
        user: { id: 'anonymous', getRoles: () => ['Anonymous'] },
      };
      await folder.restrictChildren(req, global.txn!);
      expect(folder._restrictedChildren.map((child: any) => child.id)).toEqual([
        'child-4',
        'child-2',
      ]);
    });
  });

  describe('fetchChildren', () => {
    it('should not run queries in parallel in a transaction', async () => {
      const Document = models.get('Document');
      const root = await Document.fetchOne({ path: '/' }, {}, global.txn!);
      let running = 0;
      let maximum = 0;
      const start = () => {
        running += 1;
        maximum = Math.max(maximum, running);
      };
      const end = () => {
        running -= 1;
      };
      const client = global.txn!.client;
      client.on('query', start);
      client.on('query-response', end);
      client.on('query-error', end);
      try {
        await root.fetchChildren({}, global.txn!);
      } finally {
        client.removeListener('query', start);
        client.removeListener('query-response', end);
        client.removeListener('query-error', end);
      }
      expect(root._type.id).toBe('Site');
      expect(root._children.length).toBeGreaterThan(0);
      expect(root._children[0]._type).toBeDefined();
      expect(maximum).toBe(1);
    });
  });

  describe('blocks', () => {
    const slate = (text: string) => ({
      '@type': 'slate',
      value: [{ type: 'p', children: [{ text }] }],
      plaintext: text,
    });
    let count = 0;
    const create = async (id: string, json: any) => {
      count += 1;
      const Document = models.get('Document');
      const news = await Document.fetchOne({ path: '/news' }, {}, global.txn!);
      return createDocument(
        `0123abcd-0000-4000-8000-${String(600 + count).padStart(12, '0')}`,
        news,
        id,
        'Page',
        { json: { title: id, ...json } },
      );
    };

    it('should skip layout ids without a block', async () => {
      const document = await create('dangling', {
        blocks: { text: slate('Some text') },
        blocks_layout: { items: ['missing', 'text'] },
      });
      expect(document.toMarkdown()).toBe('Some text\n\n');
      expect(await document.searchableText()).toBe('dangling Some text');
    });

    it('should handle missing blocks and layout', async () => {
      const noBlocks = await create('no-blocks', {
        blocks_layout: { items: ['missing'] },
      });
      expect(noBlocks.toMarkdown()).toBe('');
      expect(noBlocks.getBlockTypes()).toEqual([]);

      const noLayout = await create('no-layout', {
        blocks: { text: slate('Some text'), invalid: null },
      });
      expect(noLayout.toMarkdown()).toBe('');
      expect(noLayout.getBlockTypes()).toEqual(['slate']);
      expect(await noLayout.searchableText()).toBe('no-layout Some text');
    });
  });
});
