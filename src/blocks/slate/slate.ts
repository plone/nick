/**
 * Slate block.
 * @module blocks/slate/slate
 */

// External imports
import { isEqual } from 'es-toolkit/predicate';

// Internal imports
import { slateReplace, slateToMarkdown } from '../../helpers/slate/slate';

export const slate = {
  /**
   * Convert to markdown.
   * @param {any} self The block instance.
   * @param {any} _document The document instance.
   * @returns {string} The markdown string.
   */
  toMarkdown: (self: any, _document: any): string => {
    return slateToMarkdown(self.value);
  },

  /**
   * Get the searchable text, the plain text sent by the editor.
   * @param {any} self The block instance.
   * @returns {string} The searchable text.
   */
  searchableText: (self: any): string =>
    typeof self.plaintext === 'string' ? self.plaintext : '',

  /**
   * Replace text.
   * @param {RegExp} pattern Pattern to search for.
   * @param {string} replacement Replacement text.
   * @returns {any} New object or false if nothing found.
   */
  replace: (self: any, pattern: RegExp, replacement: string): any => {
    // Get new value
    const newValue = slateReplace(self.value, pattern, replacement);

    // Check if nothing changed
    if (isEqual(newValue, self.value)) {
      return false;
    }

    // Return new value
    return newValue;
  },
};
