/**
 * Job runner
 * @module scripts/job
 */

// External imports
import { omit } from 'es-toolkit/object';

// Internal imports
import { Client } from '../src/client';
import { initProfiles } from '../src/helpers/profiles/profiles';
import scheduled_jobs from '../src/scheduled_jobs';
import config from '../src/helpers/config/config';
import models from '../src/models';

// Init profiles
await initProfiles();

// Read message
process.on('message', async (data: any) => {
  // Check if process should be exited
  if (data && data.exit) {
    process.exit(0);
  } else {
    if (data.action) {
      // Create transaction
      const Document = models.get('Document');
      const trx = await Document.startTransaction();

      // Run job
      try {
        const result = await scheduled_jobs
          .getAction(data.action)
          .handler(omit(data, ['scheduled_job', 'action']), 'admin', trx);

        // Send result
        if (process.send) {
          process.send({ result });
          process.exit(0);
        }
      } catch (err) {
        // Rollback transaction
        await trx.rollback();

        // Send error
        if (process.send) {
          process.send({ error: err });
          process.exit(0);
        }
      }
    } else {
      try {
        const cli = Client.initialize({
          apiPath: `http://localhost:${config.settings.port}`,
        });
        const result = cli[data.method](omit(data, ['method']));

        // Send result
        if (process.send) {
          process.send({ result });
          process.exit(0);
        }
      } catch (err) {
        // Send error
        if (process.send) {
          process.send({ error: err });
          process.exit(0);
        }
      }
    }
  }
});
