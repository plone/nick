/**
 * Workflow tests.
 * @module routes/workflow/workflow
 */

// External imports
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// Internal imports
import app from '../../app';
import * as lock from '../../helpers/lock/lock';
import {
  createDocument,
  createUser,
  testRequest,
} from '../../helpers/tests/tests';
import models from '../../models';

const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImZ1bGxuYW1lIjoiQWRtaW4iLCJpYXQiOjE2NDkzMTI0NDl9.RS1Ny_r0v7vIylFfK6q0JVJrkiDuTOh9iG9IL8xbzAk';

/**
 * Post a transition
 * @method transition
 * @param {string} path Path of the document.
 * @param {string} transition Transition id.
 * @param {Object} body Request body.
 * @param {string} auth Token.
 * @returns {Promise<Object>} Response.
 */
function transition(
  path: string,
  transition: string,
  body: any = {},
  auth: string = token,
) {
  return request(app)
    .post(`${path}/@workflow/${transition}`)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${auth}`)
    .send(body);
}

/**
 * Fetch a document by path
 * @method fetch
 * @param {string} path Path of the document.
 * @returns {Promise<Object>} Document.
 */
function fetch(path: string) {
  const Document = models.get('Document');
  return Document.fetchOne({ path }, {}, global.txn!);
}

describe('Workflow', () => {
  it('should return the workflow', () => testRequest(app, 'workflow/get'));

  it('should change a workflow state', async () => {
    await testRequest(app, 'content/post');
    return testRequest(app, 'workflow/post');
  });

  it('should refuse a transition of an item locked by another user', async () => {
    const spy = vi.spyOn(lock, 'lockExpired').mockReturnValue(false);
    try {
      await testRequest(app, 'content/post');
      const document = await fetch('/news/my-news-item');
      await document.update(
        {
          lock: {
            locked: true,
            stealable: true,
            creator: 'editor',
            token: 'other-token',
            created: '2022-04-08T16:00:00.000Z',
            timeout: 600,
          },
        },
        global.txn!,
      );
      const res = await transition('/news/my-news-item', 'publish');
      expect(res.status).toBe(403);
      expect(res.body.error.message).toBe('Resource is locked.');
      expect((await fetch('/news/my-news-item')).workflow_state).toBe(
        'private',
      );

      // The creator of the lock may change the state
      await document.update(
        { lock: { ...document.lock, creator: 'admin' } },
        global.txn!,
      );
      expect((await transition('/news/my-news-item', 'publish')).status).toBe(
        200,
      );
    } finally {
      spy.mockRestore();
    }
  });

  it('should check the guard of a transition', async () => {
    const Workflow = models.get('Workflow');
    const workflow = await Workflow.fetchById(
      'simple_publication_workflow',
      {},
      global.txn!,
    );
    await workflow.update(
      {
        json: {
          ...workflow.json,
          transitions: {
            ...workflow.json.transitions,
            publish: {
              ...workflow.json.transitions.publish,
              guard: {
                permissions: ['Review'],
                expr: "python:request.get('confirm') == 'yes'",
              },
            },
          },
        },
      },
      global.txn!,
    );
    await testRequest(app, 'content/post');
    const list = async (query: string) =>
      (
        await request(app)
          .get(`/news/my-news-item/@workflow${query}`)
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${token}`)
      ).body.transitions.map((item: any) => item['@id'].split('/').pop());

    // The guard expression decides if the transition is offered and taken
    expect(await list('')).toEqual(['submit']);
    expect(await list('?confirm=yes')).toEqual(['publish', 'submit']);
    expect((await transition('/news/my-news-item', 'publish')).status).toBe(
      401,
    );
    const res = await transition('/news/my-news-item', 'publish', {
      confirm: 'yes',
    });
    expect(res.status).toBe(200);
    expect(res.body.review_state).toBe('published');
  });

  it('should keep the variables of a workflow', async () => {
    const Workflow = models.get('Workflow');
    const workflow = await Workflow.fetchById(
      'simple_publication_workflow',
      {},
      global.txn!,
    );
    await workflow.update(
      {
        json: {
          ...workflow.json,
          variables: {
            action: {
              default_expr: 'transition/getId|nothing',
              for_status: true,
              update_always: true,
            },
            actor: {
              default_expr: 'user/getId',
              for_status: true,
              update_always: true,
            },
            comments: {
              default_expr: "python:state_change.kwargs.get('comment', '')",
              for_status: true,
              update_always: true,
            },
            time: {
              default_expr: 'state_change/getDateTime',
              for_status: true,
              update_always: true,
            },
            review_history: {
              default_expr: 'state_change/getHistory',
              info_guard: { permissions: ['Submit', 'Review'] },
            },
            reviewed_by: { default_value: '', for_status: true },
            submissions: { default_value: 0, for_status: true },
            stage: { default_value: 'draft', for_status: true },
          },
          states: {
            ...workflow.json.states,
            published: {
              ...workflow.json.states.published,
              variables: { stage: 'live' },
            },
          },
          transitions: {
            ...workflow.json.transitions,
            submit: {
              ...workflow.json.transitions.submit,
              variables: {
                submissions:
                  "python:here.portal_workflow.getInfoFor(here, 'submissions', 0) + 1",
              },
            },
            publish: {
              ...workflow.json.transitions.publish,
              guard: {
                permissions: ['Review'],
                expr: "python:here.portal_workflow.getInfoFor(here, 'submissions') > 0",
              },
              variables: { reviewed_by: 'user/getId' },
            },
          },
        },
      },
      global.txn!,
    );
    await testRequest(app, 'content/post');
    const document = await fetch('/news/my-news-item');
    expect(
      (await document.fetchWorkflowStatus('simple_publication_workflow'))
        .variables,
    ).toEqual({
      action: null,
      actor: 'admin',
      comments: '',
      time: '2022-04-08T16:00:00.000Z',
      reviewed_by: '',
      submissions: 0,
      stage: 'draft',
    });

    // The guard reads a variable, publish needs a submission first
    expect((await transition('/news/my-news-item', 'publish')).status).toBe(
      401,
    );
    await transition('/news/my-news-item', 'submit', { comment: 'Please' });
    expect((await transition('/news/my-news-item', 'publish')).status).toBe(
      200,
    );
    const status = await (
      await fetch('/news/my-news-item')
    ).fetchWorkflowStatus('simple_publication_workflow');
    expect(status).toEqual({
      state: 'published',
      variables: {
        action: 'publish',
        actor: 'admin',
        comments: '',
        time: '2022-04-08T16:00:00.000Z',
        reviewed_by: 'admin',
        submissions: 1,
        stage: 'live',
      },
    });

    // The history has the variables, users without Submit or Review don't
    // see it (the info guard of review_history)
    const history = async (auth?: string) => {
      const req = request(app)
        .get('/news/my-news-item/@workflow')
        .set('Accept', 'application/json');
      return (await (auth ? req.set('Authorization', `Bearer ${auth}`) : req))
        .body.history;
    };
    const entries = await history(token);
    expect(entries.map((item: any) => item.action)).toEqual([
      null,
      'submit',
      'publish',
    ]);
    expect(entries[1]).toMatchObject({
      comments: 'Please',
      submissions: 1,
      stage: 'draft',
    });
    expect(entries[2]).toMatchObject({ reviewed_by: 'admin', stage: 'live' });
    expect(await history()).toEqual([]);
  });

  it('should support a chain of workflows', async () => {
    const Type = models.get('Type');
    const Workflow = models.get('Workflow');
    await Workflow.create(
      {
        id: 'flag_workflow',
        title: 'Flag',
        json: {
          initial_state: 'unflagged',
          managed_permissions: ['View', 'Modify'],
          states: {
            unflagged: {
              title: 'Unflagged',
              transitions: ['flag'],
              permissions: {},
              acquire: ['View', 'Modify'],
            },
            flagged: {
              title: 'Flagged',
              transitions: ['unflag'],
              permissions: { Administrator: ['View', 'Modify'] },
            },
          },
          transitions: {
            flag: { title: 'Flag', new_state: 'flagged', permission: 'Review' },
            unflag: {
              title: 'Unflag',
              new_state: 'unflagged',
              permission: 'Review',
            },
          },
        },
      },
      {},
      global.txn!,
    );
    const page = await Type.fetchById('Page', {}, global.txn!);
    await page.setChain(
      ['simple_publication_workflow', 'flag_workflow'],
      global.txn!,
    );
    const editor = await createUser('editor', ['Editor', 'Reader']);
    await request(app)
      .post('/news')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send({ '@type': 'Page', id: 'chained', title: 'Chained' })
      .expect(201);
    const document = await fetch('/news/chained');
    expect((await document.fetchWorkflowStatus('flag_workflow')).state).toBe(
      'unflagged',
    );
    const workflow = async (auth: string = token) =>
      (
        await request(app)
          .get('/news/chained/@workflow')
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${auth}`)
      ).body;
    const ids = (body: any) =>
      body.transitions.map((item: any) => item['@id'].split('/').pop());

    // The transitions of both workflows, the state of the first
    expect(ids(await workflow())).toEqual(['publish', 'submit', 'flag']);
    expect((await workflow()).state.id).toBe('private');

    // A transition of the second workflow changes its state only
    const res = await transition('/news/chained', 'flag', { comment: 'Spam' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      action: 'flag',
      review_state: 'flagged',
      comments: 'Spam',
    });
    const flagged = await fetch('/news/chained');
    expect(flagged.workflow_state).toBe('private');
    expect((await flagged.fetchWorkflowStatus('flag_workflow')).state).toBe(
      'flagged',
    );
    expect(flagged.workflow_history.at(-1)).toMatchObject({
      action: 'flag',
      workflow: 'flag_workflow',
    });

    // The history of @workflow is the history of the first workflow
    const body = await workflow();
    expect(ids(body)).toEqual(['publish', 'submit', 'unflag']);
    expect(body.history.map((item: any) => item.action)).toEqual([null]);

    // The second workflow takes View and Modify from the editor
    expect(await workflow(editor)).toEqual({
      message: 'You are not authorized to access this resource.',
      type: 'Unauthorized',
    });
    const catalog = await global.txn!('catalog')
      .where({ document: flagged.uuid })
      .first();
    expect(catalog._allowedUsersGroupsRoles).not.toContain('Editor');
    expect(catalog._allowedUsersGroupsRoles).toContain('Administrator');
    expect(catalog._review_state).toBe('private');

    // Unknown transitions are refused for the whole chain
    expect((await transition('/news/chained', 'flag')).status).toBe(200);
    expect((await transition('/news/chained', 'nothing')).status).toBe(400);
  });

  it('should refuse an unknown transition', async () => {
    const res = await transition('/news', 'no-such-transition');
    expect(res.status).toBe(400);
    expect(res.body.error.type).toBe('WorkflowException');
  });

  it('should refuse a transition not available in the current state', async () => {
    const res = await transition('/news', 'submit');
    expect(res.status).toBe(400);
    expect((await fetch('/news')).workflow_state).toBe('published');
  });

  it('should not record a transition to the current state', async () => {
    const before = (await fetch('/news')).workflow_history.length;
    const res = await transition('/news', 'publish');
    expect(res.status).toBe(200);
    expect(res.body.review_state).toBe('published');
    expect((await fetch('/news')).workflow_history.length).toBe(before);
  });

  it('should check the permission on every child', async () => {
    const news = await fetch('/news');
    const folder = await createDocument(
      '1c2d3e4f-0000-4000-8000-000000000001',
      news,
      'folder',
      'Folder',
      { workflow_state: 'pending' },
    );
    const sub = await createDocument(
      '1c2d3e4f-0000-4000-8000-000000000002',
      folder,
      'sub',
      'Folder',
      { inherit_roles: false, workflow_state: 'pending' },
    );
    await createDocument(
      '1c2d3e4f-0000-4000-8000-000000000003',
      sub,
      'page',
      'Page',
      { workflow_state: 'pending' },
    );
    const reviewer = await createUser('reviewer');
    await folder
      .$relatedQuery('_userRoles', global.txn!)
      .relate({ id: 'Reviewer', user: 'reviewer' });

    const res = await transition(
      '/news/folder',
      'publish',
      { include_children: true },
      reviewer,
    );
    expect(res.status).toBe(400);
    expect((await fetch('/news/folder')).workflow_state).toBe('pending');
    expect((await fetch('/news/folder/sub/page')).workflow_state).toBe(
      'pending',
    );

    // Without the blocked child the transition is applied to all
    await sub.update({ inherit_roles: true }, global.txn!);
    const ok = await transition(
      '/news/folder',
      'publish',
      { include_children: true },
      reviewer,
    );
    expect(ok.status).toBe(200);
    expect((await fetch('/news/folder/sub/page')).workflow_state).toBe(
      'published',
    );
  });

  it('should set the publication dates', async () => {
    const Document = models.get('Document');
    const news = await Document.fetchOne({ path: '/news' }, {}, global.txn!);
    const folder = await createDocument(
      '0123abcd-0000-4000-8000-000000000301',
      news,
      'dated',
      'Folder',
    );
    await createDocument(
      '0123abcd-0000-4000-8000-000000000302',
      folder,
      'child',
      'Page',
    );

    // Invalid dates are refused
    await transition('/news/dated', 'publish', {
      effective: 'not-a-date',
    }).expect(400);
    expect((await fetch('/news/dated')).workflow_state).toBe('private');

    // Submitting doesn't set the effective date
    await transition('/news/dated', 'submit').expect(200);
    expect((await fetch('/news/dated')).json.effective).toBeUndefined();

    // Dates are applied to the children too
    const res = await transition('/news/dated', 'publish', {
      include_children: true,
      effective: '2030-06-01T12:00:00',
      expires: '2031-05-06T07:08:00',
      comment: 'Published with dates',
    }).expect(200);
    expect(res.body.comments).toBe('Published with dates');
    const child = await fetch('/news/dated/child');
    expect(child.json.effective).toBe('2030-06-01T12:00:00');
    expect(child.json.expires).toBe('2031-05-06T07:08:00');
    expect(child.workflow_history.at(-1).comments).toBe('Published with dates');
    const workflow = await request(app)
      .get('/news/dated/child/@workflow')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(
      workflow.body.history.map((item: any) => [item.action, item.comments]),
    ).toStrictEqual([['publish', 'Published with dates']]);

    // Republishing keeps the effective date
    await transition('/news/dated', 'retract').expect(200);
    await transition('/news/dated', 'publish').expect(200);
    expect((await fetch('/news/dated')).json.effective).toBe(
      '2030-06-01T12:00:00',
    );
  });

  it('should set the effective date when first published', async () => {
    const Document = models.get('Document');
    const news = await Document.fetchOne({ path: '/news' }, {}, global.txn!);
    await createDocument(
      '0123abcd-0000-4000-8000-000000000303',
      news,
      'undated',
      'Page',
    );
    await transition('/news/undated', 'publish').expect(200);
    expect((await fetch('/news/undated')).json.effective).toBe(
      '2022-04-08T16:00:00.000Z',
    );
  });

  it('should refuse a post without a transition', () =>
    request(app)
      .post('/news/@workflow')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .expect(400));

  it('should let the owner view and edit a private item', async () => {
    const Document = models.get('Document');
    const news = await Document.fetchOne({ path: '/news' }, {}, global.txn!);
    const owner = await createUser('owner');
    await createDocument(
      '0123abcd-0000-4000-8000-000000000501',
      news,
      'mine',
      'Page',
      { owner: 'owner' },
    );
    const page = (method: 'get' | 'patch') =>
      request(app)
        [method]('/news/mine')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${owner}`);

    await page('get').expect(200);
    await page('patch').send({ title: 'Mine' }).expect(204);

    // Pending: the owner may view but not edit
    await transition('/news/mine', 'submit').expect(200);
    await page('get').expect(200);
    await page('patch').send({ title: 'Changed' }).expect(401);
  });
});
