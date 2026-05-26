/**
 * Seeds.
 * @module seeds
 */

// Type imports
import type { Knex } from 'knex';
import type { SeedHandler } from '../types';

// Internal imports
import { mapAsync } from '../helpers/utils/utils';

/**
 * A seeds registry.
 * @class Seeds
 */
class Seeds {
  public seeds: SeedHandler[];
  static instance: Seeds;

  /**
   * Construct a Seeds.
   * @constructs Seeds
   */
  constructor() {
    this.seeds = [];

    if (!Seeds.instance) {
      Seeds.instance = this;
    }

    return Seeds.instance;
  }

  /**
   * Register a seed.
   * @param {SeedHandler} seed The seed to register.
   */
  register(seed: SeedHandler) {
    this.seeds.push(seed);
  }

  /**
   * Check if a vocabulary exists.
   * @param {string} name The name of the vocabulary.
   * @returns {boolean} True if the vocabulary exists, false otherwise.
   */
  async run(trx: Knex.Transaction, profilePath: string): Promise<void> {
    await mapAsync(this.seeds, async (seed) => {
      await seed(trx, profilePath);
    });
  }
}

// Create an instance of the Seeds registry
const seeds = new Seeds();

// Export the instance and all seeds
export default seeds;
