/**
 * Point of contact for tasks.
 * Scheduled tasks can be used to run code at specific intervals or times.
 * This is useful for maintenance tasks, data processing, or any recurring operations.
 * Each task should be defined in its own module and exported here.
 * Each task is an object with the following properties:
 * - name: A unique name for the task.
 * - schedule: A cron-style string defining when the task should run.
 * - handler: A function that contains the code to be executed.
 * @module tasks
 * @example import tasks from './tasks';
 */

// Type imports
import type { Task } from '../types';

// External imports
import cron from 'node-cron';

// Internal imports
import { log } from '../helpers/log/log';

/**
 * A task registry.
 * @class Tasks
 */
class Tasks {
  public tasks: Task[];
  static instance: Tasks;

  /**
   * Construct a Tasks instance.
   * @constructs Tasks
   */
  constructor() {
    this.tasks = [];

    if (!Tasks.instance) {
      Tasks.instance = this;
    }

    return Tasks.instance;
  }

  /**
   * Register an task.
   * @param {Task} task The task to register.
   */
  register(task: Task) {
    const self = this;
    self.tasks.push(task);
  }

  /**
   * Run all registered tasks.
   */
  run() {
    // Run scheduled tasks
    this.tasks.forEach((task) => {
      cron.schedule(task.schedule, async () => {
        log.info(`Running scheduled task: ${task.name}`);
        await task.handler();
      });
    });
  }
}

// Create an instance of the Tasks registry
const tasks = new Tasks();

export default tasks;
