/**
 * Blobs registry.
 * @module blobs
 */

/**
 * A blobs registry.
 * @class Blobs
 */
class Blobs {
  public blobs: { [key: string]: any };
  static instance: Blobs;

  /**
   * Construct a Blobs.
   * @constructs Blobs
   */
  constructor() {
    this.blobs = {};

    if (!Blobs.instance) {
      Blobs.instance = this;
    }

    return Blobs.instance;
  }

  /**
   * Register a blob.
   * @param {string} name The name of the blob.
   * @param {BlobHandler} blob The blob to register.
   */
  register(name: string, blob: any) {
    this.blobs[name] = blob;
  }

  /**
   * Get a blob.
   * @param {string} name The name of the blob.
   * @returns {any} The blob.
   */
  get(name: string): any {
    return this.blobs[name];
  }
}

// Create an instance of the Blobs registry
const blobs = new Blobs();

// Export the instance and all blobs
export default blobs;
