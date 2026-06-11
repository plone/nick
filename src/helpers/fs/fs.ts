/**
 * File system helper.
 * @module helpers/fs/fs
 */

// Type imports
import type { Metadata } from 'sharp';
import type { Knex } from 'knex';

// External imports
import {
  access as accessPromise,
  copyFile as copyFilePromise,
  readFile as readFilePromise,
  writeFile as writeFilePromise,
  rm as rmPromise,
} from 'node:fs/promises';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { v4 as uuid, validate } from 'uuid';

// Internal imports
import config from '../../helpers/config/config';
import models from '../../models';
import { mapAsync } from '../utils/utils';

/**
 * Connect to S3
 * @method connectS3
 * @returns {S3Client} S3 client instance
 */
export function connectS3() {
  return new S3Client({
    region: config.settings.s3.region,
    credentials: {
      accessKeyId: config.settings.s3.accessKeyId,
      secretAccessKey: config.settings.s3.secretAccessKey,
    },
  });
}

/**
 * Get scale dimensions
 * @method getScaleDimensions
 * @param {number} orgWidth Original width
 * @param {number} orgHeight Original height
 * @param {number} limitWidth Limit width
 * @param {number} limitHeight Limit height
 * @returns {[number, number]} Object with new width and height attributes
 */
export function getScaleDimensions(
  orgWidth: number,
  orgHeight: number,
  limitWidth: number,
  limitHeight: number,
): [number, number] {
  const scale = Math.max(orgWidth / limitWidth, orgHeight / limitHeight) || 1;
  return [Math.round(orgWidth / scale), Math.round(orgHeight / scale)];
}

/**
 * Image dimensions
 * @typedef {[number, number]} Dimensions
 */
export type Dimensions = [number, number];

/**
 * Get dimensions
 * @method getDimensions
 * @param {Metadata} metadata Image metadata
 * @returns {Dimensions} Array of width and height.
 */
export function getDimensions(metadata: Metadata): Dimensions {
  return metadata.orientation && metadata.orientation > 4
    ? [metadata.height || 0, metadata.width || 0]
    : [metadata.width || 0, metadata.height || 0];
}

/**
 * Read file
 * @method readFile
 * @param {string} uuid Uuid of the file to read.
 * @param {Knex.Transaction} trx Transaction object.
 * @returns {Promise<Buffer>} File buffer.
 */
export async function readFile(
  uuid: string,
  trx: Knex.Transaction,
): Promise<Buffer> {
  if (config.settings.blobs === 'db') {
    const File = models.get('File');
    return (await File.fetchById(uuid, {}, trx)).data;
  } else if (config.settings.blobs === 's3') {
    const s3 = connectS3();
    const command = new GetObjectCommand({
      Bucket: config.settings.s3.bucket,
      Key: uuid,
    });
    const response = await s3.send(command);
    return (await response?.Body?.transformToByteArray()) as Buffer;
  } else {
    if (!validate(uuid)) {
      throw `Invalid uuid: ${uuid}`;
    }
    try {
      return await readFilePromise(`${config.settings.blobsDir}/${uuid}`);
    } catch (_err) {
      throw `Can not read file`;
    }
  }
}

/**
 * Read profile file
 * @method readProfileFile
 * @param {string} profile Profile path
 * @param {string} path Path of the file
 * @returns {Promise<string>} Base64 string of the file
 */
export async function readProfileFile(
  profile: string,
  path: string,
): Promise<string> {
  const file = `${profile}${path}`;
  try {
    return await readFilePromise(file, { encoding: 'base64' });
  } catch (_err) {
    throw `Can not read file: ${file}`;
  }
}

/**
 * Buffer encoding
 * @typedef {('ascii'|'base64'|'binary'|'hex'|'latin1'|'ucs-2'|'ucs2'|'utf-8'|'utf16le'|'utf8')} BufferEncoding
 */

/**
 * Write file meta data
 * @typedef {object} WriteFileMeta
 * @property {string} uuid Uuid of the file
 * @property {number} size Size of the file
 */
export interface WriteFileMeta {
  uuid: string;
  size: number;
}

/**
 * Write file
 * @method writeFile
 * @param {string} data Data of the file
 * @param {BufferEncoding} encoding Encoding of the file data
 * @param {Knex.Transaction} trx Transaction object.
 * @returns {Promise<WriteFileMeta>} Return data of the file written.
 */
export async function writeFile(
  data: string,
  encoding: BufferEncoding,
  trx: Knex.Transaction,
): Promise<WriteFileMeta> {
  const buffer = Buffer.from(data, encoding);
  const id = uuid();

  // Write file to disk
  await storeFile(id, buffer, trx);

  // Return data
  return {
    uuid: id,
    size: Buffer.byteLength(buffer),
  };
}

/**
 * Image Scale
 * @typedef {object} ImageScale
 * @property {string} uuid Uuid of the image
 * @property {number} width Size of the image
 * @property {number} height Size of the image
 */
export interface ImageScale {
  uuid: string;
  width: number;
  height: number;
}

/**
 * Image Scales
 * @typedef {object.<string, ImageScale>} ImageScales
 */
export interface ImageScales {
  [index: string]: ImageScale;
}

/**
 * Write image meta data
 * @typedef {object} WriteImageMeta
 * @property {string} uuid Uuid of the image
 * @property {number} size Size of the image
 * @property {number} width Size of the image
 * @property {number} height Size of the image
 */
export interface WriteImageMeta {
  uuid: string;
  size: number;
  width: number;
  height: number;
  scales: ImageScales;
}

/**
 * Store file
 * @method storeFile
 * @param {string} uuid Uuid of the file
 * @param {Buffer} data Data to store
 * @param {Knex.Transaction} trx Transaction object.
 * @returns {Promise<void>} Void
 */
export async function storeFile(
  uuid: string,
  data: Buffer,
  trx: Knex.Transaction | undefined,
): Promise<void> {
  if (config.settings.blobs === 'db') {
    const File = models.get('File');
    await File.create(
      {
        uuid,
        data,
      },
      {},
      trx,
    );
  } else if (config.settings.blobs === 's3') {
    const s3 = connectS3();
    const command = new PutObjectCommand({
      Body: data,
      Bucket: config.settings.s3.bucket,
      Key: uuid,
    });
    await s3.send(command);
  } else {
    if (!validate(uuid)) {
      throw `Invalid uuid: ${uuid}`;
    }
    await writeFilePromise(`${config.settings.blobsDir}/${uuid}`, data);
  }
}

/**
 * Write image
 * @method writeImage
 * @param {string} data Data of the image
 * @param {BufferEncoding} encoding Encoding of the image data
 * @param {Knex.Transaction} trx Transaction object.
 * @returns {Promise<WriteImageMeta>} Return data of the image written.
 */
export async function writeImage(
  data: string,
  encoding: BufferEncoding,
  trx: Knex.Transaction,
): Promise<WriteImageMeta> {
  const buffer = Buffer.from(data, encoding);
  const id = uuid();

  // Write file to disk
  await storeFile(id, buffer, trx);

  // Create image and get metadata
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const [width, height] = getDimensions(metadata);
  const scales: ImageScales = {};

  // Write scales
  await mapAsync(
    Object.keys(config.settings.imageScales),
    async (scale: string) => {
      const scaleId = uuid();
      if ((await image.metadata()).format === 'svg') {
        await storeFile(scaleId, buffer, trx);
      } else {
        const scaleImage = sharp(buffer)
          .rotate()
          .resize(
            config.settings.imageScales[scale][0],
            config.settings.imageScales[scale][1],
            {
              fit: 'inside',
            },
          );
        const scaleBuffer = await scaleImage.toBuffer();
        await storeFile(scaleId, scaleBuffer, trx);
      }
      const [scaleWidth, scaleHeight] = getScaleDimensions(
        width,
        height,
        config.settings.imageScales[scale][0],
        config.settings.imageScales[scale][1],
      );
      scales[scale] = {
        uuid: scaleId,
        width: scaleWidth,
        height: scaleHeight,
      };
    },
  );

  // Return data
  return {
    uuid: id,
    size: Buffer.byteLength(buffer),
    width,
    height,
    scales,
  };
}

/**
 * Remove file
 * @method removeFile
 * @param {string} uuid Uuid of the file to remove.
 * @param {Knex.Transaction} trx Transaction object.
 * @returns {Promise<void>} Void
 */
export async function removeFile(
  uuid: string,
  trx: Knex.Transaction,
): Promise<void> {
  if (config.settings.blobs === 'db') {
    const File = models.get('File');
    await File.deleteById(uuid, trx);
  } else if (config.settings.blobs === 's3') {
    const s3 = connectS3();
    const command = new DeleteObjectCommand({
      Bucket: config.settings.s3.bucket,
      Key: uuid,
    });
    await s3.send(command);
  } else {
    if (!validate(uuid)) {
      throw `Invalid uuid: ${uuid}`;
    }
    await rmPromise(`${config.settings.blobsDir}/${uuid}`);
  }
}

/**
 * Copy file
 * @method copyFile
 * @param {string} source Uuid of the source file.
 * @param {string} target Uuid of the target file.
 * @param {Knex.Transaction} trx Transaction object.
 * @returns {Promise<void>} Void
 */
export async function copyFile(
  source: string,
  target: string,
  trx: Knex.Transaction | undefined,
): Promise<void> {
  if (config.settings.blobs === 'db') {
    const File = models.get('File');
    const buffer = (await File.fetchById(source, {}, trx)).data;
    await storeFile(target, buffer, trx);
  } else if (config.settings.blobs === 's3') {
    const s3 = connectS3();
    const command = new CopyObjectCommand({
      Bucket: config.settings.s3.bucket,
      CopySource: `${config.settings.s3.bucket}/${source}`,
      Key: target,
    });
    await s3.send(command);
  } else {
    if (!validate(source)) {
      throw `Invalid source uuid: ${source}`;
    }
    if (!validate(target)) {
      throw `Invalid target uuid: ${target}`;
    }
    await copyFilePromise(
      `${config.settings.blobsDir}/${source}`,
      `${config.settings.blobsDir}/${target}`,
    );
  }
}

/**
 * Check if file exists
 * @method fileExists
 * @param {string} file Path of the file to check.
 * @returns {Promise<boolean>} True if file exists
 */
export async function fileExists(file: string): Promise<boolean> {
  try {
    await accessPromise(`${file}.ts`);
    return true;
  } catch {
    try {
      await accessPromise(`${file}.json`);
      return true;
    } catch {
      try {
        await accessPromise(`${file}.js`);
        return true;
      } catch {
        return false;
      }
    }
  }
}

/**
 * Check if directory exists
 * @method dirExists
 * @param {string} dir Path of the directory to check.
 * @returns {Promise<boolean>} True if dir exists
 */
export async function dirExists(dir: string): Promise<boolean> {
  try {
    await accessPromise(dir);
    return true;
  } catch {
    return false;
  }
}
