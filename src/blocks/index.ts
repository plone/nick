/**
 * Block registry.
 * @module blocks
 */

// Type imports
import type { Block } from '../types';

// Internal imports
import { block } from './_block/_block';

/**
 * A block registry.
 * @class Blocks
 */
class Blocks {
  public blocks: { [key: string]: Block };
  static instance: Blocks;

  /**
   * Construct a Config.
   * @constructs Config
   */
  constructor() {
    this.blocks = {};

    if (!Blocks.instance) {
      Blocks.instance = this;
    }

    return Blocks.instance;
  }

  /**
   * Register a block.
   * @param {string} name The name of the block.
   * @param {Block} block The block to register.
   */
  register(name: string, block: Block) {
    this.blocks[name] = block;
  }

  /**
   * Get a block.
   * @param {string} name The name of the block.
   * @returns {Block} The block.
   */
  get(name: string): Block {
    if (!this.blocks[name]) {
      return this.blocks['_default'];
    }
    return {
      ...this.blocks['_default'],
      ...this.blocks[name],
    };
  }
}

// Create an instance of the Blocks registry
const blocks = new Blocks();

// Register the default block
blocks.register('_default', block);

// Export the instance and all blocks
export default blocks;
