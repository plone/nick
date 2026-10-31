/**
 * Workflow seed.
 * @module seeds/workflow/workflow
 */

// Type imports
import type { Knex } from 'knex';

// External imports
import { merge } from 'es-toolkit/object';
import { promises as fs } from 'fs';

// Internal imports
import {
  convertDefinition,
  parseWorkflowBindings,
} from '../../helpers/dcworkflow/dcworkflow';
import { dirExists, fileExists } from '../../helpers/fs/fs';
import { stripI18n } from '../../helpers/i18n/i18n';
import { mapAsync } from '../../helpers/utils/utils';
import models from '../../models';

/**
 * Read the DCWorkflow definitions of a profile: every
 * `workflows/<id>/definition.xml`, like a GenericSetup profile. The id of
 * the workflow is the name of the directory.
 * @method readDefinitions
 * @param {string} profilePath Path of the profile.
 * @returns {Promise<Object[]>} Workflows.
 */
export async function readDefinitions(profilePath: string): Promise<any[]> {
  const path = `${profilePath}/workflows`;
  if (!(await dirExists(path))) {
    return [];
  }
  const ids = (await fs.readdir(path)).sort();
  const workflows: any[] = [];
  await mapAsync(ids, async (id: string) => {
    const file = `${path}/${id}/definition.xml`;
    if (await dirExists(file)) {
      const { workflow, warnings } = convertDefinition(
        await fs.readFile(file, 'utf8'),
        id,
      );
      warnings.map((warning) => console.warn(`Workflow ${warning}`));
      workflows.push(workflow);
    }
  });
  return workflows;
}

/**
 * Create or update workflows. Unsupported expressions are refused, unless
 * the loader marked them unsupported (they deny at runtime).
 * @method importWorkflows
 * @param {Knex.Transaction} trx Transaction object.
 * @param {Object[]} workflows Workflows.
 * @param {boolean} replace Replace existing workflows instead of merging.
 */
export async function importWorkflows(
  trx: Knex.Transaction,
  workflows: any[],
  replace: boolean = false,
): Promise<void> {
  const Workflow = models.get('Workflow');
  await mapAsync(workflows, async (workflow: any) => {
    Workflow.checkExpressions(workflow.json).map((problem: any) => {
      const message = `Workflow ${workflow.id}, ${problem.where}: unsupported expression "${problem.expr}" (${problem.reason})`;
      if (!problem.acknowledged) {
        throw new Error(message);
      }
      console.warn(`${message}, it denies`);
    });

    // Check if type exists
    const current: any = await Workflow.fetchById(workflow.id, {}, trx);

    // If doesn’t exist
    if (!current) {
      await Workflow.create(workflow, {}, trx);
    } else if (replace) {
      // Replace the definition, for example with an exported workflow
      await Workflow.update(workflow.id, workflow, trx);
    } else {
      await Workflow.update(
        workflow.id,
        merge((current as any).$toDatabaseJson(), workflow),
        trx,
      );
    }
  });
}

/**
 * Bind workflow chains to types with the GenericSetup `workflows.xml` of a
 * profile (`<bindings><type type_id="..."><bound-workflow .../>`). Types
 * which don't exist and empty chains (Nick types always have a workflow)
 * are skipped.
 * @method seedWorkflowBindings
 * @param {Knex.Transaction} trx Transaction object.
 * @param {string} profilePath Path of the profile.
 */
export async function seedWorkflowBindings(
  trx: Knex.Transaction,
  profilePath: string,
): Promise<void> {
  const Type = models.get('Type');
  const file = `${profilePath}/workflows.xml`;
  if (!(await dirExists(file))) {
    return;
  }
  const bindings = parseWorkflowBindings(await fs.readFile(file, 'utf8'));
  await mapAsync(Object.keys(bindings.types), async (id: string) => {
    const chain = bindings.types[id];
    const type = await Type.fetchById(id, {}, trx);
    if (!type) {
      console.warn(`Workflow bindings: type ${id} not found`);
    } else if (chain.length === 0) {
      console.warn(`Workflow bindings: type ${id} keeps its workflow`);
    } else {
      await type.setChain(chain, trx);
    }
  });
  console.log('Workflow bindings imported');
}

export const seedWorkflow = async (
  trx: Knex.Transaction,
  profilePath: string,
): Promise<void> => {
  const Workflow = models.get('Workflow');
  if (await fileExists(`${profilePath}/workflows`)) {
    const profile = stripI18n(
      (await import(`${profilePath}/workflows`)).default,
    );
    if (profile.purge) {
      await Workflow.delete({}, trx);
    }
    await importWorkflows(trx, profile.workflows, profile.replace);
    console.log('Workflows imported');
  }

  // DCWorkflow definitions replace existing workflows, like GenericSetup
  const definitions = await readDefinitions(profilePath);
  if (definitions.length > 0) {
    await importWorkflows(trx, definitions, true);
    console.log('Workflow definitions imported');
  }
};
