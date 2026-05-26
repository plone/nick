/**
 * Vocabularies.
 * @module vocabularies
 */

// Type imports
import type { VocabularyHandler } from '../types';

/**
 * A vocabulary registry.
 * @class Vocabularies
 */
class Vocabularies {
  public vocabularies: { [key: string]: VocabularyHandler };
  static instance: Vocabularies;

  /**
   * Construct a Vocabularies.
   * @constructs Vocabularies
   */
  constructor() {
    this.vocabularies = {};

    if (!Vocabularies.instance) {
      Vocabularies.instance = this;
    }

    return Vocabularies.instance;
  }

  /**
   * Register a vocabulary.
   * @param {string} name The name of the vocabulary.
   * @param {Vocabulary} vocabulary The vocabulary to register.
   */
  register(name: string, vocabulary: VocabularyHandler) {
    this.vocabularies[name] = vocabulary;
  }

  /**
   * Get a vocabulary.
   * @param {string} name The name of the vocabulary.
   * @returns {Vocabulary} The vocabulary.
   */
  get(name: string): VocabularyHandler {
    if (!this.vocabularies[name]) {
      return this.vocabularies['_default'];
    }
    return this.vocabularies[name];
  }

  /**
   * Check if a vocabulary exists.
   * @param {string} name The name of the vocabulary.
   * @returns {boolean} True if the vocabulary exists, false otherwise.
   */
  exists(name: string): boolean {
    return Object.keys(this.vocabularies).includes(name);
  }
}

// Create an instance of the Vocabularies registry
const vocabularies = new Vocabularies();

// Export the instance and all vocabularies
export default vocabularies;
