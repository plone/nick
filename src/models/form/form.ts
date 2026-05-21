/**
 * Form Model.
 * @module models/form/form
 */

// Internal imports
import { Model } from '../_model/_model';

/**
 * A model for Form.
 * @class Form
 * @extends Model
 */
export class Form extends Model {
  static tableName: string = 'form';
  static idColumn: string = 'uuid';
}
