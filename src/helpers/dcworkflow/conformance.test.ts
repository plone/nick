/**
 * Workflow conformance tests: the standard Plone 6.2 workflows, loaded from
 * their definition.xml, offer the same transitions as Plone in every state
 * to every role. The reference answers were captured from Plone 6.2 over
 * HTTP (GET @workflow per role) by the restapi-suite's
 * tests/test_workflow_matrix.py.
 *
 * The definitions are part of Products.CMFPlone and plone.app.discussion
 * (GPL-2.0) and are not included in Nick: set `PLONE_WORKFLOWS_DIR` to
 * their `profiles/default/workflows` directories (separated by `:`) to run
 * these tests, see docs/developer-guide/workflows.md.
 * @module helpers/dcworkflow/conformance.test
 */

// External imports
import { existsSync, readFileSync } from 'fs';
import { delimiter } from 'path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

// Internal imports
import app from '../../app';
import { stripI18n } from '../i18n/i18n';
import { createDocument, createUser } from '../tests/tests';
import models from '../../models';
import page from '../../profiles/core/types/page.json';
import { importWorkflows } from '../../seeds/workflow/workflow';
import { convertDefinition } from './dcworkflow';

const reference = JSON.parse(
  readFileSync(
    `${import.meta.dirname}/fixtures/workflow_matrix_plone62.json`,
    'utf8',
  ),
);

// Directories with the Plone workflow definitions (`<id>/definition.xml`)
const directories = (process.env.PLONE_WORKFLOWS_DIR || '')
  .split(delimiter)
  .filter((directory) => directory !== '');

/**
 * Find the definition.xml of a Plone workflow in `PLONE_WORKFLOWS_DIR`.
 * @method findDefinition
 * @param {string} workflow Id of the workflow.
 * @returns {string | undefined} Path of the definition, if found.
 */
function findDefinition(workflow: string): string | undefined {
  return directories
    .map((directory) => `${directory}/${workflow}/definition.xml`)
    .find((path) => existsSync(path));
}

/**
 * Read the definition.xml of a Plone workflow, skip the test without it.
 * @method readDefinition
 * @param {string} workflow Id of the workflow.
 * @param {Object} context Test context.
 * @returns {string} Definition.
 */
function readDefinition(
  workflow: string,
  context: { skip: (note?: string) => never },
): string {
  const path = findDefinition(workflow);
  if (!path) {
    context.skip(
      `${workflow}/definition.xml is not in PLONE_WORKFLOWS_DIR (${directories.join(delimiter)})`,
    );
  }
  return readFileSync(path!, 'utf8');
}

// Roles of the matrix: how the user of each role is set up in Nick
const roles: Record<string, { global?: string[]; local?: string }> = {
  Anonymous: {},
  Member: {},
  Owner: {},
  Reader: { local: 'Reader' },
  Contributor: { local: 'Contributor' },
  Editor: { local: 'Editor' },
  Reviewer: { local: 'Reviewer' },
  'Site Administrator': { global: ['Administrator'] },
  Manager: { global: ['Administrator'] },
};

// A cell: the status of GET @workflow and the offered transitions
interface Cell {
  status: number;
  available: string[];
}

/**
 * Compute the matrix of a workflow on Nick: for every state and role the
 * transitions offered by GET @workflow (none without View).
 * @method computeMatrix
 * @param {string} workflow Id of the workflow.
 * @param {string} xml Definition of the workflow.
 * @returns {Promise<Object>} Transitions by state and role.
 */
async function computeMatrix(
  workflow: string,
  xml: string,
): Promise<Record<string, Record<string, Cell>>> {
  const Document = models.get('Document');
  const Type = models.get('Type');
  const id = `wfmatrix_${workflow}`;

  // Load the definition and bind it to a type
  const { workflow: definition } = convertDefinition(xml, id);
  await importWorkflows(global.txn!, [definition], true);
  const type = stripI18n(page);
  const typeModel = await Type.create(
    { ...type, id, title: id, workflow: id },
    {},
    global.txn!,
  );
  await typeModel.cacheSchema(global.txn!);

  // Users, a published folder with the local roles and an item per state
  const tokens: Record<string, string> = {};
  for (const role of Object.keys(roles)) {
    if (role !== 'Anonymous') {
      tokens[role] = await createUser(
        `wfm_${role.toLowerCase().replace(' ', '')}`,
        roles[role].global || [],
      );
    }
  }
  const root = await Document.fetchOne({ path: '/' }, {}, global.txn!);
  const folder = await createDocument(
    '7e8f9a0b-0000-4000-8000-000000000000',
    root,
    'wfmatrix',
    'Folder',
    { workflow_state: 'published' },
  );
  for (const role of Object.keys(roles)) {
    if (roles[role].local) {
      await global.txn!('user_role_document').insert({
        document: folder.uuid,
        user: `wfm_${role.toLowerCase()}`,
        role: roles[role].local,
      });
    }
  }
  const matrix: Record<string, Record<string, Cell>> = {};
  const states = Object.keys(reference.workflows[workflow].states);
  for (let i = 0; i < states.length; i++) {
    const state = states[i];
    await createDocument(
      `7e8f9a0b-0000-4000-8000-00000000000${i + 1}`,
      folder,
      state,
      id,
      { workflow_state: state, owner: 'wfm_owner' },
    );
    matrix[state] = {};
    for (const role of Object.keys(roles)) {
      const req = request(app)
        .get(`/wfmatrix/${state}/@workflow`)
        .set('Accept', 'application/json');
      const res = await (tokens[role]
        ? req.set('Authorization', `Bearer ${tokens[role]}`)
        : req);
      matrix[state][role] = {
        status: res.status,
        available:
          res.status === 200
            ? res.body.transitions.map((item: any) =>
                item['@id'].split('/').pop(),
              )
            : [],
      };
    }
  }
  return matrix;
}

/**
 * Compare a matrix with the reference, cell by cell (state, transition,
 * role), and if the roles can view the items.
 * @method compare
 * @param {string} workflow Id of the workflow.
 * @param {Object} matrix Computed matrix.
 * @returns {Object} Number of cells and the differences.
 */
function compare(
  workflow: string,
  matrix: Record<string, Record<string, Cell>>,
): { cells: number; diffs: string[] } {
  const info = reference.workflows[workflow];
  const diffs: string[] = [];
  let cells = 0;
  Object.keys(info.states).map((state) =>
    (info.transitions.length > 0 ? info.transitions : [null]).map(
      (transition: string | null) =>
        Object.keys(roles).map((role) => {
          cells += 1;
          const want = transition
            ? info.states[state][role].available.includes(transition)
            : info.states[state][role].available.length > 0;
          const got = transition
            ? matrix[state][role].available.includes(transition)
            : matrix[state][role].available.length > 0;
          if (want !== got) {
            diffs.push(
              `${state}/${transition}/${role}: plone ${want}, nick ${got}`,
            );
          }
        }),
    ),
  );
  Object.keys(info.states).map((state) =>
    Object.keys(roles).map((role) => {
      const want = info.states[state][role].status === 200;
      const got = matrix[state][role].status === 200;
      if (want !== got) {
        diffs.push(`${state}/${role} can view: plone ${want}, nick ${got}`);
      }
    }),
  );
  return { cells, diffs };
}

describe('Workflow conformance', () => {
  const generated: string[] = reference.generated?.workflows || [];

  // Without the definitions the tests are skipped, this entry says why
  if (directories.length === 0) {
    it.skip('needs PLONE_WORKFLOWS_DIR: the workflows directories of Products.CMFPlone and plone.app.discussion (see docs/developer-guide/workflows.md)', () => {});
  }

  describe.skipIf(directories.length === 0)(
    'with the Plone definitions',
    () => {
      it.for(
        Object.keys(reference.workflows).filter(
          (id) => !generated.includes(id),
        ),
      )(
        'offers the transitions of Plone 6.2 in %s',
        async (workflow: string, context) => {
          const xml = readDefinition(workflow, context);
          const { cells, diffs } = compare(
            workflow,
            await computeMatrix(workflow, xml),
          );
          expect(cells).toBeGreaterThan(0);
          expect(diffs).toEqual([]);
        },
      );

      // Generated from DCWorkflow semantics (not installed on the reference
      // site). Their items acquire View from the parent in some states, Nick
      // acquires from the global role permissions, so only the other states
      // are compared.
      it.for(generated)(
        'offers the transitions of DCWorkflow in %s where View is not acquired',
        async (workflow: string, context) => {
          const xml = readDefinition(workflow, context);
          const { workflow: definition } = convertDefinition(xml);
          const acquired = Object.keys(definition.json.states).filter((state) =>
            (definition.json.states[state].acquire || []).includes('View'),
          );
          const { diffs } = compare(
            workflow,
            await computeMatrix(workflow, xml),
          );
          expect(
            diffs.filter((diff) => !acquired.includes(diff.split('/')[0])),
          ).toEqual([]);
        },
      );
    },
  );
});
