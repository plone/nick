/**
 * Db handler for blobs
 * @module blobs/db/db
 */

// Type imports
import type { Knex } from 'knex';

// Internal imports
import models from '../../models';

export const db = {
  /**
   * Read
   * @method read
   * @param {string} uuid Uuid of the file to read.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<Buffer>} File buffer.
   */
  read: async (uuid: string, trx: Knex.Transaction) => {
    const File = models.get('File');
    return (await File.fetchById(uuid, {}, trx)).data;
  },

  /**
   * Store
   * @method store
   * @param {string} uuid Uuid of the file
   * @param {Buffer} data Data to store
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<void>} Void
   */
  store: async (
    uuid: string,
    data: Buffer,
    trx: Knex.Transaction | undefined,
  ): Promise<void> => {
    const File = models.get('File');
    await File.create(
      {
        uuid,
        data,
      },
      {},
      trx,
    );
  },

  /**
   * Remove file
   * @method removeFile
   * @param {string} uuid Uuid of the file to remove.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<void>} Void
   */
  remove: async (uuid: string, trx: Knex.Transaction): Promise<void> => {
    const File = models.get('File');
    await File.deleteById(uuid, trx);
  },

  /**
   * Copy file
   * @method copyFile
   * @param {string} source Uuid of the source file.
   * @param {string} target Uuid of the target file.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<void>} Void
   */
  copy: async (
    source: string,
    target: string,
    trx: Knex.Transaction | undefined,
  ): Promise<void> => {
    const File = models.get('File');
    const buffer = (await File.fetchById(source, {}, trx)).data;
    await db.store(target, buffer, trx);
  },
};
