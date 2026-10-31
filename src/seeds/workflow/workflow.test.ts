/**
 * Workflow seed tests.
 * @module seeds/workflow/workflow.test
 */

// External imports
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { describe, it, expect } from 'vitest';

// Internal imports
import '../../app';
import models from '../../models';
import { seedWorkflow, seedWorkflowBindings } from './workflow';

const json = {
  initial_state: 'private',
  states: {
    private: {
      title: 'Private',
      transitions: [],
      permissions: { Owner: ['View'] },
    },
  },
  transitions: {},
};

/**
 * Seed a workflows profile.
 * @param {Object} profile Workflows profile.
 */
const seed = async (profile: any) => {
  const path = mkdtempSync(`${tmpdir()}/nick-seed-`);
  writeFileSync(`${path}/workflows.json`, JSON.stringify(profile));
  await seedWorkflow(global.txn!, path);
  rmSync(path, { recursive: true, force: true });
};

describe('seedWorkflow', () => {
  it('merges an existing workflow by default', async () => {
    const Workflow = models.get('Workflow');
    await seed({
      purge: false,
      workflows: [{ id: 'simple_publication_workflow', json }],
    });
    const workflow = await Workflow.fetchById(
      'simple_publication_workflow',
      {},
      global.txn!,
    );
    expect(Object.keys(workflow.json.states)).toContain('published');
  });

  it('replaces an existing workflow when replace is set', async () => {
    const Workflow = models.get('Workflow');
    await seed({
      purge: false,
      replace: true,
      workflows: [
        {
          id: 'simple_publication_workflow',
          title: 'Simple',
          description: 'Exported workflow. '.repeat(20),
          json,
        },
      ],
    });
    const workflow = await Workflow.fetchById(
      'simple_publication_workflow',
      {},
      global.txn!,
    );
    expect(workflow.json).toEqual(json);
    expect(workflow.description.length).toBeGreaterThan(255);
  });

  it('refuses unsupported guard expressions', async () => {
    const guarded = (guard: any) => ({
      purge: false,
      workflows: [
        {
          id: 'guarded_workflow',
          title: 'Guarded',
          json: {
            ...json,
            transitions: {
              hide: { title: 'Hide', new_state: 'private', guard },
            },
          },
        },
      ],
    });
    await expect(
      seed(guarded({ expr: "python:here.guard_handler('hide')" })),
    ).rejects.toThrow(/unsupported expression/);

    // An expression marked unsupported by the loader is kept, it denies
    await seed(
      guarded({
        expr: "python:here.guard_handler('hide')",
        unsupported: 'Method "guard_handler" is not registered.',
      }),
    );
    const Workflow = models.get('Workflow');
    const workflow = await Workflow.fetchById(
      'guarded_workflow',
      {},
      global.txn!,
    );
    expect(workflow.json.transitions.hide.guard.unsupported).toBeDefined();
  });

  it('imports DCWorkflow definitions and bindings of a profile', async () => {
    const Type = models.get('Type');
    const Workflow = models.get('Workflow');
    const path = mkdtempSync(`${tmpdir()}/nick-seed-`);
    mkdirSync(`${path}/workflows/my_team_workflow`, { recursive: true });
    writeFileSync(
      `${path}/workflows/my_team_workflow/definition.xml`,
      readFileSync(
        `${import.meta.dirname}/../../helpers/dcworkflow/fixtures/workflows/team_space_workflow/definition.xml`,
      ),
    );
    writeFileSync(
      `${path}/workflows.xml`,
      `<object name="portal_workflow">
 <bindings>
  <type type_id="Page"><bound-workflow workflow_id="my_team_workflow"/><bound-workflow workflow_id="simple_publication_workflow"/></type>
  <type type_id="NoSuchType"><bound-workflow workflow_id="my_team_workflow"/></type>
 </bindings>
</object>`,
    );
    try {
      await seedWorkflow(global.txn!, path);
      await seedWorkflowBindings(global.txn!, path);
    } finally {
      rmSync(path, { recursive: true, force: true });
    }

    // The id is the name of the directory
    const workflow = await Workflow.fetchById(
      'my_team_workflow',
      {},
      global.txn!,
    );
    expect(workflow.title).toBe('Team Space');
    expect(Object.keys(workflow.json.states).sort()).toEqual([
      'closed',
      'open',
      'team',
    ]);
    expect(workflow.json.manager_bypass).toBe(true);
    expect(workflow.json.transitions.share.guard).toEqual({
      permissions: ['Submit'],
    });
    expect(workflow.json.transitions.open_up.guard).toEqual({
      roles: ['Administrator'],
      groups: ['Administrators'],
    });
    const page = await Type.fetchById('Page', {}, global.txn!);
    expect(page.workflow).toBe('my_team_workflow');
    expect(
      (await page.fetchChain(global.txn!)).map((item: any) => item.id),
    ).toEqual(['my_team_workflow', 'simple_publication_workflow']);
  });
});
