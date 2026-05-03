/**
 * Id from title behavior.
 * @module behaviors/id_from_title/id_from_title
 */

// External imports
import slugify from 'slugify';

// Internal imports
import { uniqueId } from '../../helpers/utils/utils';

interface Document {
  id: string;
  json: {
    title: string;
  };
}

/**
 * Id from title behavior.
 * @constant id_from_title
 */
export const id_from_title = {
  /**
   * Set id
   * @method getId
   * @param {string} id Provided id (can be empty)
   * @param {Array} blacklist Blacklist ids
   * @returns {string} Id
   */
  setId: function (this: Document, id?: string, blacklist?: string[]): void {
    this.id = uniqueId(
      id ||
        slugify(this.json.title, { lower: true, remove: /[*+~.()'"!:@?]/g }),
      blacklist || [],
    );
  },
};
