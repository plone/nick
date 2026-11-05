/**
 * Somersault block, the Plate document of Plone Aurora.
 * @module blocks/somersault/somersault
 *
 * Plone Aurora stores the whole content of a page in one block, with the id
 * and the type `__somersault__`, whose `value` is a Plate document. Once a
 * page has this block, `blocks_layout` and the other blocks are not used.
 */

// External imports
import { isEqual } from 'es-toolkit/predicate';

// Internal imports
import blocks from '..';
import {
  mapPlateBlocks,
  plateToMarkdown,
  plateToText,
} from '../../helpers/plate/plate';
import { slateReplace } from '../../helpers/slate/slate';

/**
 * Id and type of the somersault block.
 * @constant SOMERSAULT
 */
export const SOMERSAULT = '__somersault__';

export const somersault = {
  /**
   * Convert to markdown, wrapped blocks use the markdown of their type.
   * @param {any} self The block instance.
   * @param {any} document The document instance.
   * @returns {string} The markdown string.
   */
  toMarkdown: (self: any, document: any): string =>
    plateToMarkdown(self.value, (node) =>
      node['@type'] === SOMERSAULT
        ? ''
        : blocks.get(node['@type']).toMarkdown(node, document),
    ),

  /**
   * Get the searchable text, the title is left out since it is indexed from
   * the title field.
   * @param {any} self The block instance.
   * @returns {string} The searchable text.
   */
  searchableText: (self: any): string =>
    plateToText(
      self.value,
      (node) =>
        node['@type'] === SOMERSAULT
          ? ''
          : blocks.get(node['@type']).searchableText(node),
      ['title'],
    ),

  /**
   * Replace text.
   * @param {RegExp} pattern Pattern to search for.
   * @param {string} replacement Replacement text.
   * @returns {any} New object or false if nothing found.
   */
  replace: (self: any, pattern: RegExp, replacement: string): any => {
    if (!Array.isArray(self.value)) {
      return false;
    }

    // Get new value
    const newValue = slateReplace(self.value, pattern, replacement);

    // Check if nothing changed
    if (isEqual(newValue, self.value)) {
      return false;
    }

    // Return new value
    return newValue;
  },

  /**
   * Process block, the wrapped blocks are processed by their type.
   * @param {any} self The block instance.
   * @returns {any} Processed block
   */
  process: async (self: any): Promise<any> =>
    Array.isArray(self.value)
      ? {
          ...self,
          value: await mapPlateBlocks(self.value, (node) =>
            node['@type'] === SOMERSAULT
              ? Promise.resolve(node)
              : blocks.get(node['@type']).process(node),
          ),
        }
      : self,
};
