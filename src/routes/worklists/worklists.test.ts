/**
 * Worklists tests.
 * @module routes/worklists/worklists.test
 */

// External imports
import { readFileSync } from 'fs';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

// Internal imports
import app from '../../app';
import { convertDefinition } from '../../helpers/dcworkflow/dcworkflow';
import { stripI18n } from '../../helpers/i18n/i18n';
import { createDocument, createUser } from '../../helpers/tests/tests';
import models from '../../models';
import page from '../../profiles/core/types/page.json';
import { importWorkflows } from '../../seeds/workflow/workflow';

/**
 * Get the worklists as a user.
 * @method worklists
 * @param {string} token Token of the user.
 * @returns {Promise<Object>} Response body.
 */
async function worklists(token: string) {
  return (
    await request(app)
      .get('/@worklists')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`)
  ).body;
}

describe('Worklists', () => {
  it('lists the worklists of the user with their items', async () => {
    const Document = models.get('Document');
    const Type = models.get('Type');

    // The editorial fixture workflow with its worklists, plus one matching
    // a variable with an expression, bound to a type
    const { workflow: editorial } = convertDefinition(
      readFileSync(
        `${import.meta.dirname}/../../helpers/dcworkflow/fixtures/workflows/editorial_workflow/definition.xml`,
        'utf8',
      ),
    );
    await importWorkflows(
      global.txn!,
      [
        {
          ...editorial,
          json: {
            ...editorial.json,
            worklists: {
              ...editorial.json.worklists,
              mine: {
                title: 'My drafts',
                match: {
                  review_state: ['draft'],
                  owner: ['python:user.getId()'],
                },
              },
            },
            variables: {
              ...editorial.json.variables,
              owner: { for_status: true, default_expr: 'user/getId' },
            },
          },
        },
      ],
      true,
    );
    const type = await Type.create(
      {
        ...stripI18n(page),
        id: 'Story',
        title: 'Story',
        workflow: 'editorial_workflow',
      },
      {},
      global.txn!,
    );
    await type.cacheSchema(global.txn!);

    const reviewer = await createUser('reviewer', ['Reviewer']);
    const member = await createUser('member', []);
    const news = await Document.fetchOne({ path: '/news' }, {}, global.txn!);
    for (const [index, state] of [
      'in_review',
      'in_review',
      'draft',
      'live',
    ].entries()) {
      const document = await createDocument(
        `4d5e6f70-0000-4000-8000-00000000000${index}`,
        news,
        `item-${index}`,
        'Story',
        { workflow_state: state, owner: 'reviewer' },
      );
      await document.saveWorkflowStatus(
        'editorial_workflow',
        state,
        { owner: 'reviewer', stage: index === 2 ? 'writing' : 'done' },
        global.txn!,
      );
    }

    // The reviewer passes the guard (Review portal content) of the desk
    // inbox, the urgent drafts match the state and a variable
    const body = await worklists(reviewer);
    expect(body.items.map((item: any) => item.id)).toEqual([
      'desk_inbox',
      'mine',
      'urgent_drafts',
    ]);
    const inbox = body.items[0];
    expect(inbox).toMatchObject({
      '@id': 'http://localhost:8080/@worklists/editorial_workflow/desk_inbox',
      workflow: 'editorial_workflow',
      title: 'Stories for the desk',
      items_total: 2,
      action: {
        title: 'Desk (2)',
        url: 'http://localhost:8080/search?review_state=in_review',
        category: 'global',
      },
    });
    expect(inbox.items.map((item: any) => item['@id'])).toEqual([
      'http://localhost:8080/news/item-0',
      'http://localhost:8080/news/item-1',
    ]);
    expect(body.items[2]).toMatchObject({
      title: 'Urgent drafts',
      items_total: 1,
    });

    // A match on a variable with an expression: the draft the reviewer
    // owns
    expect(body.items[1]).toMatchObject({ title: 'My drafts', items_total: 1 });
    expect(body.items[1].items[0]['@id']).toBe(
      'http://localhost:8080/news/item-2',
    );

    // Without the permission or matches there are no worklists
    expect((await worklists(member)).items).toEqual([]);
  });
});
