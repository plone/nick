/**
 * Job Model.
 * @module models/job/job
 */

// Internal imports
import { Model } from '../_model/_model';

/**
 * A model for Job.
 * @class Job
 * @extends Model
 */
export class Job extends Model {
  static tableName: string = 'job';
  static idColumn: string = 'uuid';
}
