/**
 * Workflow model tests.
 * @module models/workflow/workflow.test
 */

// External imports
import request from 'supertest';
import { describe, expect, it } from 'vitest';

// Internal imports
import app from '../../app';
import { createDocument, createUser } from '../../helpers/tests/tests';
import models from '../../models';
import { Workflow } from './workflow';

const json: any = {
  states: {
    open: { permissions: { Editor: ['View'] } },
    restricted: {
      permissions: { Editor: ['View', 'Modify'] },
      acquire: ['Modify'],
    },
  },
};

describe('Workflow', () => {
  describe('getManagedPermissions', () => {
    it('defaults to the permissions used in the states', () => {
      expect(Workflow.getManagedPermissions(json)).toEqual(['View', 'Modify']);
      expect(
        Workflow.getManagedPermissions({
          ...json,
          managed_permissions: ['View'],
        }),
      ).toEqual(['View']);
    });
  });

  describe('applyPermissions', () => {
    it('adds the state permissions to the global ones with the additive model', () => {
      const workflow = Workflow.fromJson({
        id: 'test',
        json: { ...json, permission_model: 'additive' },
      });
      expect(
        workflow.applyPermissions('restricted', ['Reader'], ['View', 'Add']),
      ).toEqual(['View', 'Add']);
    });

    it('replaces global permissions with the acquire model by default', () => {
      const workflow = Workflow.fromJson({ id: 'test', json });

      // View is managed and not acquired, Add is not managed
      expect(
        workflow.applyPermissions('restricted', ['Reader'], ['View', 'Add']),
      ).toEqual(['Add']);

      // Modify is acquired in the restricted state
      expect(
        workflow.applyPermissions('restricted', ['Reader'], ['Modify']),
      ).toEqual(['Modify']);

      // The roles of the state still get their permissions
      expect(workflow.applyPermissions('open', ['Editor'], ['Add'])).toEqual([
        'Add',
        'View',
      ]);
    });
  });

  describe('acquire permission model', () => {
    it('removes global View in a state without it', async () => {
      const Document = models.get('Document');
      const Workflow = models.get('Workflow');
      const reader = await createUser('reader', ['Reader']);
      const news = await Document.fetchOne({ path: '/news' }, {}, global.txn!);
      const page = await createDocument(
        '3c4d5e6f-0000-4000-8000-000000000001',
        news,
        'page',
        'Page',
      );
      const get = () =>
        request(app)
          .get('/news/page')
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${reader}`);
      const allowed = async () => {
        await page.reindexSecurity(global.txn!);
        return (
          await global.txn!('catalog').where({ document: page.uuid }).first()
        )._allowedUsersGroupsRoles;
      };
      // The permissions outside of a request, like in move, search and lock
      const userPermissions = async () => {
        const User = models.get('User');
        const user = await User.fetchById(
          'reader',
          { related: '[_roles, _groups._roles]' },
          global.txn!,
        );
        const document = await Document.fetchOne(
          { uuid: page.uuid },
          {},
          global.txn!,
        );
        return document.fetchUserPermissions(user, global.txn!);
      };

      // The core private state gives Reader View
      await get().expect(200);
      expect(await allowed()).toContain('Reader');
      expect(await userPermissions()).toContain('View');

      // A private state without Reader hides the page from global Readers
      const workflow = await Workflow.fetchById(
        'simple_publication_workflow',
        {},
        global.txn!,
      );
      const { Reader: _reader, ...permissions } =
        workflow.json.states.private.permissions;
      const json = {
        ...workflow.json,
        states: {
          ...workflow.json.states,
          private: { ...workflow.json.states.private, permissions },
        },
      };
      await workflow.update({ json }, global.txn!);
      await get().expect(401);
      expect(await allowed()).not.toContain('Reader');
      expect(await userPermissions()).not.toContain('View');

      // Unless the workflow keeps the additive model
      await workflow.update(
        { json: { ...json, permission_model: 'additive' } },
        global.txn!,
      );
      await get().expect(200);
      expect(await allowed()).toContain('Reader');
      expect(await userPermissions()).toContain('View');
    });
  });

  describe('guards', () => {
    /**
     * Change the core workflow and return the transitions a user has on a
     * new private page.
     * @param {Object} changes Transition changes.
     * @param {Object} options Workflow options.
     * @param {string} owner Owner of the page.
     * @returns {Promise<Function>} Function returning the transitions of a
     * user (by id).
     */
    const setup = async (
      changes: any,
      options: any = {},
      owner: string = 'admin',
    ) => {
      const Document = models.get('Document');
      const User = models.get('User');
      const Workflow = models.get('Workflow');
      const workflow = await Workflow.fetchById(
        'simple_publication_workflow',
        {},
        global.txn!,
      );
      const transitions = { ...workflow.json.transitions };
      Object.keys(changes).map((id) => {
        transitions[id] = { ...transitions[id], ...changes[id] };
      });
      await workflow.update(
        { json: { ...workflow.json, ...options, transitions } },
        global.txn!,
      );
      const news = await Document.fetchOne({ path: '/news' }, {}, global.txn!);
      const page = await createDocument(
        '3c4d5e6f-0000-4000-8000-000000000002',
        news,
        'guarded',
        'Page',
        { owner },
      );
      await page.fetchRelated('_type', global.txn!);
      return async (id: string) => {
        const user = await User.query(global.txn!)
          .withGraphJoined('[_roles, _groups._roles]')
          .findById(id);
        const current = await Workflow.fetchById(
          'simple_publication_workflow',
          {},
          global.txn!,
        );
        return await current.getAvailableTransitions('private', {
          document: page,
          user,
          trx: global.txn!,
        });
      };
    };

    it('needs one of the roles', async () => {
      await createUser('owner', []);
      await createUser('editor', ['Editor']);
      await createUser('administrator', ['Administrator']);
      const transitions = await setup(
        { publish: { guard: { roles: ['Owner', 'Editor'] } } },
        {},
        'owner',
      );
      expect(await transitions('owner')).toEqual(['publish', 'submit']);
      expect(await transitions('editor')).toEqual(['publish', 'submit']);
      expect(await transitions('administrator')).toEqual(['submit']);
    });

    it('lets administrators pass with manager_bypass', async () => {
      await createUser('administrator', ['Administrator']);
      const transitions = await setup(
        { publish: { guard: { roles: ['Owner'] } } },
        { manager_bypass: true },
      );
      expect(await transitions('administrator')).toEqual(['publish', 'submit']);
    });

    it('needs one of the permissions', async () => {
      await createUser('editor', ['Editor']);
      await createUser('reader', ['Reader']);
      const transitions = await setup({
        publish: { guard: { permissions: ['Review', 'Modify'] } },
      });
      expect(await transitions('editor')).toEqual(['publish', 'submit']);
      expect(await transitions('reader')).toEqual([]);
    });

    it('needs one of the groups', async () => {
      await createUser('member', []);
      await createUser('staffer', []);
      await global.txn!('group').insert({ id: 'staff', title: 'Staff' });
      await global.txn!('user_group').insert({
        user: 'staffer',
        group: 'staff',
      });
      const transitions = await setup({
        publish: { guard: { groups: ['staff'] } },
        submit: { guard: { groups: ['AuthenticatedUsers'] } },
      });
      expect(await transitions('staffer')).toEqual(['publish', 'submit']);
      expect(await transitions('member')).toEqual(['submit']);
    });

    it('evaluates guard expressions', async () => {
      await createUser('owner', []);
      await createUser('editor', ['Editor']);
      const transitions = await setup(
        {
          publish: {
            guard: {
              expr: "python:user.has_role('Owner', here) and checkPermission('Modify portal content', here)",
            },
          },
          submit: {
            guard: {
              expr: "python:here.aq_parent.getId() == 'news' and request.get('nothing') is None",
            },
          },
        },
        {},
        'owner',
      );
      expect(await transitions('owner')).toEqual(['publish', 'submit']);
      expect(await transitions('editor')).toEqual(['submit']);
    });

    it('denies with an unsupported expression', async () => {
      await createUser('editor', ['Editor']);
      const transitions = await setup({
        publish: {
          guard: {
            permissions: ['Review', 'Modify'],
            expr: "python:here.guard_handler('publish')",
            unsupported: 'Method "guard_handler" is not registered.',
          },
        },
      });
      expect(await transitions('editor')).toEqual(['submit']);
    });

    it('leaves out hidden and automatic transitions', async () => {
      await createUser('editor', ['Editor']);
      await createUser('reviewer', ['Reviewer']);
      const transitions = await setup({
        publish: { hidden: true },
        submit: { trigger: 'automatic' },
      });
      expect(await transitions('editor')).toEqual([]);
      expect(await transitions('reviewer')).toEqual([]);
    });
  });

  describe('checkExpressions', () => {
    it('lists the unsupported guard expressions', () => {
      expect(
        Workflow.checkExpressions({
          states: {},
          transitions: {
            a: { title: 'A', new_state: 'x', guard: { expr: 'here/title' } },
            b: {
              title: 'B',
              new_state: 'x',
              guard: { expr: 'python:here.may_publish()' },
            },
            c: {
              title: 'C',
              new_state: 'x',
              guard: { expr: 'here/isValid', unsupported: 'yes' },
            },
          },
        }),
      ).toEqual([
        {
          where: 'transition b',
          expr: 'python:here.may_publish()',
          reason:
            'Method "may_publish" of the content object is not registered.',
          acknowledged: false,
        },
        {
          where: 'transition c',
          expr: 'here/isValid',
          reason:
            '"isValid" on content is not a known field or a registered method.',
          acknowledged: true,
        },
      ]);
    });
  });
});
