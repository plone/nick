/**
 * File Model.
 * @module models/file/file
 */

// Internal imports
import { Model } from '../_model/_model';

/**
 * A model for File.
 * @class File
 * @extends Model
 */
export class File extends Model {
  static idColumn: string = 'uuid';
}
