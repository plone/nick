/**
 * Somersault block, the document model of `@plone/plate`.
 * @module blocks/somersault/somersault
 *
 * Editors built on `@plone/plate`, like the default editor of Plone Aurora
 * and the `@kitconcept/volto-plate` add-on for Volto, store the whole content
 * of a page in one block, with the id and the type `__somersault__`, whose
 * `value` is a Plate document. Once a page has this block, `blocks_layout`
 * and the other blocks are not used.
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
import type {
  PlateNode,
  PlateValue,
  SomersaultBlock,
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
   * @param {SomersaultBlock} self The block instance.
   * @param {any} document The document instance.
   * @returns {string} The markdown string.
   */
  toMarkdown: (self: SomersaultBlock, document: any): string =>
    plateToMarkdown(self.value, (node) =>
      node['@type'] === SOMERSAULT
        ? ''
        : blocks.get(node['@type']).toMarkdown(node, document),
    ),

  /**
   * Get the searchable text, the title is left out since it is indexed from
   * the title field.
   * @param {SomersaultBlock} self The block instance.
   * @returns {string} The searchable text.
   */
  searchableText: (self: SomersaultBlock): string =>
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
   * @param {SomersaultBlock} self The block instance.
   * @param {RegExp} pattern Pattern to search for.
   * @param {string} replacement Replacement text.
   * @returns {PlateValue | false} New value or false if nothing found.
   */
  replace: (
    self: SomersaultBlock,
    pattern: RegExp,
    replacement: string,
  ): PlateValue | false => {
    if (!Array.isArray(self.value)) {
      return false;
    }

    // Get new value
    const newValue = slateReplace(self.value, pattern, replacement);

    // Check if nothing changed
    if (isEqual(newValue, self.value)) {
      return false;
    }

    // Return new value, only the text of the text nodes changed
    return newValue as PlateValue;
  },

  /**
   * Process block, the wrapped blocks are processed by their type.
   * @param {SomersaultBlock} self The block instance.
   * @returns {SomersaultBlock} Processed block
   */
  process: async (self: SomersaultBlock): Promise<SomersaultBlock> =>
    Array.isArray(self.value)
      ? {
          ...self,
          // Only the wrapped blocks are replaced, by their processed data
          value: (await mapPlateBlocks(self.value, (node) =>
            node['@type'] === SOMERSAULT
              ? Promise.resolve<PlateNode>(node)
              : blocks.get(node['@type']).process(node),
          )) as PlateValue,
        }
      : self,
};
