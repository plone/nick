/**
 * Scheduled Job Model.
 * @module models/scheduled_job/scheduled_job
 */

// Internal imports
import { Model } from '../_model/_model';

/**
 * A model for Scheduled Job.
 * @class ScheduledJob
 * @extends Model
 */
export class ScheduledJob extends Model {
  static tableName: string = 'scheduled_job';
}
