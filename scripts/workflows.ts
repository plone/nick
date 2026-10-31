/* eslint no-console: 0 */
/**
 * Import DCWorkflow definitions:
 * pnpm workflows:import [--json] [--type=<type>] <definition.xml | directory>...
 *
 * A file is a GenericSetup `definition.xml`, its id is the name of its
 * directory. A directory contains `<id>/definition.xml` files, like the
 * `workflows` directory of a GenericSetup profile. With `--json` the
 * converted workflows are printed as a `workflows.json` profile file and
 * nothing is imported. `--type` binds the (first) imported workflow to a
 * type.
 * @module scripts/workflows
 */

// External imports
import { promises as fs } from 'fs';
import { basename, dirname } from 'path';

// Internal imports
import { convertDefinition } from '../src/helpers/dcworkflow/dcworkflow';
import { knex } from '../src/helpers/knex/knex';
import { initProfiles } from '../src/helpers/profiles/profiles';
import models from '../src/models';
import {
  importWorkflows,
  readDefinitions,
} from '../src/seeds/workflow/workflow';

/**
 * Main function
 * @function main
 * @return {undefined}
 */
async function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const type = args.find((arg) => arg.startsWith('--type='))?.slice(7);
  const paths = args.filter((arg) => !arg.startsWith('--'));
  if (paths.length === 0) {
    console.error(
      'Usage: pnpm workflows:import [--json] [--type=<type>] <definition.xml | directory>...',
    );
    process.exitCode = 2;
    return;
  }

  // Convert the definitions
  const workflows: any[] = [];
  for (const path of paths) {
    if ((await fs.stat(path)).isDirectory()) {
      workflows.push(
        ...(await readDefinitions(path.replace(/\/workflows\/?$/, ''))),
      );
    } else {
      const { workflow, warnings } = convertDefinition(
        await fs.readFile(path, 'utf8'),
        basename(dirname(path)),
      );
      warnings.map((warning) => console.warn(`Workflow ${warning}`));
      workflows.push(workflow);
    }
  }
  if (json) {
    console.log(
      JSON.stringify({ purge: false, replace: true, workflows }, null, 2),
    );
    return;
  }

  // Import them
  await initProfiles();
  const trx = await knex.transaction();
  try {
    await importWorkflows(trx, workflows, true);
    if (type && workflows.length > 0) {
      await models.get('Type').update(type, { workflow: workflows[0].id }, trx);
    }
    await trx.commit();
    console.log(
      `Imported ${workflows.map((workflow) => workflow.id).join(', ')}`,
    );
  } catch (err) {
    await trx.rollback();
    console.error(err);
    process.exitCode = 1;
  } finally {
    knex.destroy();
  }
}

main();
