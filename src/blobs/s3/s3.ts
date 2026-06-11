/**
 * S3 handler for blobs
 * @module blobs/s3/s3
 */

// Type imports
import type { Knex } from 'knex';

// External imports
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

// Internal imports
import config from '../../helpers/config/config';
import models from '../../models';

/**
 * Connect to S3
 * @method connectS3
 * @returns {S3Client} S3 client instance
 */
function connectS3() {
  return new S3Client({
    region: config.settings.s3.region,
    credentials: {
      accessKeyId: config.settings.s3.accessKeyId,
      secretAccessKey: config.settings.s3.secretAccessKey,
    },
  });
}

export const s3 = {
  /**
   * Read
   * @method read
   * @param {string} uuid Uuid of the file to read.
   * @param {Knex.Transaction} _trx Transaction object.
   * @returns {Promise<Buffer>} File buffer.
   */
  read: async (uuid: string, _trx: Knex.Transaction) => {
    const s3 = connectS3();
    const command = new GetObjectCommand({
      Bucket: config.settings.s3.bucket,
      Key: uuid,
    });
    const response = await s3.send(command);
    return (await response?.Body?.transformToByteArray()) as Buffer;
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
    const s3 = connectS3();
    const command = new PutObjectCommand({
      Body: data,
      Bucket: config.settings.s3.bucket,
      Key: uuid,
    });
    await s3.send(command);
  },

  /**
   * Remove file
   * @method removeFile
   * @param {string} uuid Uuid of the file to remove.
   * @param {Knex.Transaction} _trx Transaction object.
   * @returns {Promise<void>} Void
   */
  remove: async (uuid: string, _trx: Knex.Transaction): Promise<void> => {
    const s3 = connectS3();
    const command = new DeleteObjectCommand({
      Bucket: config.settings.s3.bucket,
      Key: uuid,
    });
    await s3.send(command);
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
    const s3 = connectS3();
    const command = new CopyObjectCommand({
      Bucket: config.settings.s3.bucket,
      CopySource: `${config.settings.s3.bucket}/${source}`,
      Key: target,
    });
    await s3.send(command);
  },
};
