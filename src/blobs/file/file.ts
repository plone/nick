/**
 * File handler for blobs
 * @module blobs/file/file
 */

// Type imports
import type { Knex } from 'knex';

// External imports
import {
  copyFile as copyFilePromise,
  readFile as readFilePromise,
  writeFile as writeFilePromise,
  rm as rmPromise,
} from 'node:fs/promises';

// Internal imports
import config from '../../helpers/config/config';

export const file = {
  /**
   * Read
   * @method read
   * @param {string} uuid Uuid of the file to read.
   * @param {Knex.Transaction} trx Transaction object.
   * @returns {Promise<Buffer>} File buffer.
   */
  read: async (uuid: string, _trx: Knex.Transaction) => {
    try {
      return await readFilePromise(`${config.settings.blobsDir}/${uuid}`);
    } catch (_err) {
      throw `Can not read file`;
    }
  },

  /**
   * Store
   * @method store
   * @param {string} uuid Uuid of the file
   * @param {Buffer} data Data to store
   * @param {Knex.Transaction} _trx Transaction object.
   * @returns {Promise<void>} Void
   */
  store: async (
    uuid: string,
    data: Buffer,
    _trx: Knex.Transaction | undefined,
  ): Promise<void> => {
    await writeFilePromise(`${config.settings.blobsDir}/${uuid}`, data);
  },

  /**
   * Remove file
   * @method removeFile
   * @param {string} uuid Uuid of the file to remove.
   * @param {Knex.Transaction} _trx Transaction object.
   * @returns {Promise<void>} Void
   */
  remove: async (uuid: string, _trx: Knex.Transaction): Promise<void> => {
    await rmPromise(`${config.settings.blobsDir}/${uuid}`);
  },

  /**
   * Copy file
   * @method copyFile
   * @param {string} source Uuid of the source file.
   * @param {string} target Uuid of the target file.
   * @param {Knex.Transaction} _trx Transaction object.
   * @returns {Promise<void>} Void
   */
  copy: async (
    source: string,
    target: string,
    _trx: Knex.Transaction | undefined,
  ): Promise<void> => {
    await copyFilePromise(
      `${config.settings.blobsDir}/${source}`,
      `${config.settings.blobsDir}/${target}`,
    );
  },
};
