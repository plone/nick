/**
 * Html block.
 * @module blocks/html/html
 */

// External imports
import { isEqual } from 'es-toolkit/predicate';
import Turndown from 'turndown';
import xss from 'xss';

// Internal imports
import config from '../../helpers/config/config';

export const html = {
  /**
   * Convert to markdown.
   * @param {any} self The block instance.
   * @param {any} _document The document instance.
   * @returns {string} The markdown string.
   */
  toMarkdown: (self: any, _document: any): string => {
    const turndown = new Turndown();
    return turndown.turndown(self.html);
  },

  /**
   * Replace text.
   * @param {RegExp} pattern Pattern to search for.
   * @param {string} replacement Replacement text.
   * @returns {any} New object or false if nothing found.
   */
  replace: (self: any, pattern: RegExp, replacement: string): any => {
    // Get new value
    const newValue = self.html.replaceAll(pattern, replacement);

    // Check if nothing changed
    if (isEqual(newValue, self.html)) {
      return false;
    }

    // Return new value
    return newValue;
  },

  /**
   * Process block.
   * @param {any} self The block instance.
   * @returns {any} Processed block
   */
  process: async (self: any): Promise<any> => ({
    ...self,
    html: xss(self.html, config.settings.xss),
  }),
};
