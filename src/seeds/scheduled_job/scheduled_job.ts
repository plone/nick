/**
 * Scheduled Job seed.
 * @module seeds/scheduled_job/scheduled_job
 */

// Type imports
import type { Knex } from 'knex';

// External imports
import { omit } from 'es-toolkit/object';

// Internal imports
import { fileExists } from '../../helpers/fs/fs';
import { stripI18n } from '../../helpers/i18n/i18n';
import { mapAsync } from '../../helpers/utils/utils';
import models from '../../models';

export const seedScheduledJob = async (
  trx: Knex.Transaction,
  profilePath: string,
): Promise<void> => {
  const ScheduledJob = models.get('ScheduledJob');
  if (await fileExists(`${profilePath}/scheduled_jobs`)) {
    const profile = stripI18n(
      (await import(`${profilePath}/scheduled_jobs`)).default,
    );
    if (profile.purge) {
      await ScheduledJob.delete({}, trx);
    }
    await mapAsync(
      profile.scheduled_jobs,
      async (scheduled_job: any, index: number) => {
        await ScheduledJob.create(
          {
            id: scheduled_job.id || `scheduled-job-${index + 1}`,
            title: scheduled_job.title || `Scheduled Job ${index + 1}`,
            description: scheduled_job.description || '',
            enabled:
              scheduled_job.enabled !== undefined
                ? scheduled_job.enabled
                : true,
            action: scheduled_job.action || '',
            params: scheduled_job.params || {},
            schedule: scheduled_job.schedule || '0 0 * * *',
          },
          {},
          trx,
        );
      },
    );
    console.log('Scheduled jobs imported');
  }
};
