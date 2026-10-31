/**
 * Document seed tests.
 * @module seeds/document/document.test
 */

// External imports
import { randomUUID } from 'crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { v4 as uuid, validate } from 'uuid';
import { describe, it, expect, afterEach, vi } from 'vitest';

// Internal imports
import '../../app';
import models from '../../models';
import { seedDocument } from './document';

/**
 * Write a profile with the given documents.
 * @param {Object} documents Documents by filename.
 * @returns {string} Path of the profile.
 */
const writeProfile = (documents: Record<string, any>): string => {
  const path = mkdtempSync(`${tmpdir()}/nick-seed-`);
  mkdirSync(`${path}/documents`);
  Object.keys(documents).map((filename) =>
    writeFileSync(
      `${path}/documents/${filename}`,
      JSON.stringify(documents[filename]),
    ),
  );
  return path;
};

describe('seedDocument', () => {
  let profile: string;

  afterEach(() => {
    rmSync(profile, { recursive: true, force: true });
    vi.mocked(uuid).mockReturnValue(
      'a95388f2-e4b3-4292-98aa-62656cbd5b9c' as any,
    );
    vi.mocked(validate).mockReset();
  });

  it('uses the path of the document when specified', async () => {
    const Document = models.get('Document');
    profile = writeProfile({
      'news.report~2epdf.json': {
        path: '/news/report.pdf',
        uuid: '5b5e1c3e-2c6a-4f7e-9b1a-3f0d4a2c1e01',
        type: 'Page',
        title: 'Report',
      },
    });

    await seedDocument(global.txn!, profile);

    const document = await Document.fetchOne(
      { path: '/news/report.pdf' },
      {},
      global.txn!,
    );
    expect(document.id).toBe('report.pdf');
    expect(document.uuid).toBe('5b5e1c3e-2c6a-4f7e-9b1a-3f0d4a2c1e01');
    const parent = await Document.fetchOne({ path: '/news' }, {}, global.txn!);
    expect(document.parent).toBe(parent.uuid);
  });

  it('imports files with filename and content type and shares unchanged files with versions', async () => {
    const Document = models.get('Document');
    vi.mocked(uuid).mockImplementation((() => randomUUID()) as any);
    vi.mocked(validate).mockReturnValue(true);
    const file = {
      path: '/blobs/data',
      filename: 'data.csv',
      'content-type': 'text/csv',
    };
    profile = writeProfile({
      'news.data~2ecsv.json': {
        path: '/news/data.csv',
        uuid: '5b5e1c3e-2c6a-4f7e-9b1a-3f0d4a2c1e02',
        type: 'File',
        title: 'Data',
        file,
        versions: [
          { title: 'Data v1', file },
          { title: 'Data', file },
        ],
      },
    });
    mkdirSync(`${profile}/documents/blobs`);
    writeFileSync(`${profile}/documents/blobs/data`, 'a;b\n1;2\n');

    await seedDocument(global.txn!, profile);

    const document = await Document.fetchOne(
      { path: '/news/data.csv' },
      { related: '_versions' },
      global.txn!,
    );
    expect(document.json.file).toMatchObject({
      'content-type': 'text/csv',
      filename: 'data.csv',
      size: 8,
    });
    expect(
      document._versions.map((version: any) => version.json.file.uuid),
    ).toEqual([document.json.file.uuid, document.json.file.uuid]);
  });

  it('keeps the position of documents in their parent', async () => {
    const Document = models.get('Document');
    profile = writeProfile({
      'news.a.json': {
        uuid: '5b5e1c3e-2c6a-4f7e-9b1a-3f0d4a2c1e03',
        type: 'Page',
        title: 'A',
        position_in_parent: 1,
      },
      'news.b.json': {
        uuid: '5b5e1c3e-2c6a-4f7e-9b1a-3f0d4a2c1e04',
        type: 'Page',
        title: 'B',
        position_in_parent: 0,
      },
    });

    await seedDocument(global.txn!, profile);

    const a = await Document.fetchOne({ path: '/news/a' }, {}, global.txn!);
    const b = await Document.fetchOne({ path: '/news/b' }, {}, global.txn!);
    expect([a.position_in_parent, b.position_in_parent]).toEqual([1, 0]);
  });

  it('restores the workflow variables', async () => {
    const Document = models.get('Document');
    const Workflow = models.get('Workflow');
    const workflow = await Workflow.fetchById(
      'simple_publication_workflow',
      {},
      global.txn!,
    );
    await workflow.update(
      {
        json: {
          ...workflow.json,
          variables: { reviewer: { for_status: true, default_value: '' } },
        },
      },
      global.txn!,
    );
    profile = writeProfile({
      'variables.json': {
        uuid: '5b5e1c3e-2c6a-4f7e-9b1a-3f0d4a2c1e09',
        type: 'Page',
        title: 'Variables',
        workflow_state: 'pending',
        workflow_history: [
          { action: null, actor: 'admin', review_state: 'private' },
          {
            action: 'submit',
            actor: 'admin',
            review_state: 'pending',
            reviewer: 'jane',
          },
        ],
      },
    });

    await seedDocument(global.txn!, profile);

    const document = await Document.fetchOne(
      { path: '/variables' },
      {},
      global.txn!,
    );
    expect(
      await document.fetchWorkflowStatus('simple_publication_workflow'),
    ).toEqual({ state: 'pending', variables: { reviewer: 'jane' } });
  });
});
