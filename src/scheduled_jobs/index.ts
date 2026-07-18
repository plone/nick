/**
 * A scheduled jobs registry.
 * @module scheduled_jobs
 */

// Type imports
import type { Knex } from 'knex';
import type {
  Request,
  ScheduledJobAction,
  ScheduledJobActions,
  ScheduledJobActionJson,
} from '../types';

// External imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import cron from 'node-cron';
import { v4 as uuid } from 'uuid';

// Internal imports
import { stripI18n } from '../helpers/i18n/i18n';
import { translateSchema } from '../helpers/schema/schema';
import jobs from '../helpers/jobs/jobs';
import models from '../models';

dayjs.extend(utc);

/**
 * A scheduled job registry.
 * @class ScheduledJobs
 */
class ScheduledJobs {
  public actions: ScheduledJobActions;
  public tasks: any[];
  static instance: ScheduledJobs;

  /**
   * Construct a Scheduled Jobs registry.
   * @constructs ScheduledJobs
   */
  constructor() {
    this.actions = {};
    this.tasks = [];

    if (!ScheduledJobs.instance) {
      ScheduledJobs.instance = this;
    }

    return ScheduledJobs.instance;
  }

  /**
   * Register an action rule.
   * @param {string} name The name of the action.
   * @param {ScheduledJobAction} rule The action to register.
   */
  registerAction(name: string, rule: ScheduledJobAction) {
    this.actions[name] = rule;
  }

  /**
   * Get an action rule.
   * @param {string} name The name of the action rule.
   * @returns {ScheduledJobAction} The action rule.
   */
  getAction(name: string): ScheduledJobAction {
    return this.actions[name];
  }

  /**
   * Get a list of all actions.
   * @param {Request} req The request object.
   * @returns {ScheduledJobActionJson[]} The actions.
   */
  getActions(req: Request): ScheduledJobActionJson[] {
    const self: ScheduledJobs = this;
    return Object.entries(self.actions).map(
      ([name, action]: [string, ScheduledJobAction]) => ({
        addview: name,
        title: action.getTitle(req),
        description: action.getDescription(req),
        '@schema': translateSchema(stripI18n(action.schema), req),
      }),
    );
  }

  /**
   * Refresh all tasks.
   * @param {Knex.Transaction} trx The transaction object.
   * @returns {Promise<void>} A promise that resolves when the tasks have been reregistered.
   */
  async refreshTasks(trx?: Knex.Transaction) {
    const self = this;

    // Destroy existing tasks
    self.tasks.forEach((task) => task.destroy());
    self.tasks = [];

    // Reregister tasks
    const ScheduledJob = models.get('ScheduledJob');
    const Job = models.get('Job');
    const scheduledJobs = await ScheduledJob.fetchAll({}, {}, trx);

    // Register new tasks
    scheduledJobs.map((scheduledJob: any) => {
      if (scheduledJob.enabled) {
        const task = cron.schedule(scheduledJob.schedule, async () => {
          const newUuid = uuid();
          const created = dayjs.utc().format();
          await Job.create(
            {
              uuid: newUuid,
              title: scheduledJob.title,
              description: scheduledJob.description,
              params: {
                scheduled_job: scheduledJob.id,
                action: scheduledJob.action,
                ...scheduledJob.params,
              },
              actor: 'admin',
              created,
              started: null,
              finished: null,
              status: 'created',
              result: {},
            },
            {},
            trx,
          );

          // Check if job needs to be ran
          await jobs.check(trx);
        });
        self.tasks.push(task);
      }
    });
  }
}

// Create an instance of the Scheduled Job registry
const scheduledJobs = new ScheduledJobs();

// Export the instance and all content rules
export default scheduledJobs;
