/**
 * Content tests.
 * @module routes/content/content
 */

// External imports
import { v4 as uuid, validate } from 'uuid';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Internal imports
import app from '../../app';
import config from '../../helpers/config/config';
import {
  adminToken,
  createDocument,
  createUser,
  createUserWithToken,
  testRequest,
} from '../../helpers/tests/tests';
import models from '../../models';

const token = adminToken;

// A 1x1 pixel png image
const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('Content', () => {
  beforeEach(() => {
    const mockDate = new Date(Date.UTC(2022, 0, 1));
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return a content object', () => testRequest(app, 'content/get'));

  it('should add a content object', () => testRequest(app, 'content/post'));

  it('should update a content object', async () => {
    await testRequest(app, 'content/post');
    return testRequest(app, 'content/patch');
  });

  it('should delete a content object', async () => {
    await testRequest(app, 'content/post');
    return testRequest(app, 'content/delete');
  });

  it('should return not found when content not found', () =>
    testRequest(app, 'content/get_notfound'));

  it('should return bad request when required field is missing', () =>
    testRequest(app, 'content/post_badrequest'));

  it('should be able to handle reordering of content', async () => {
    await testRequest(app, 'content/post');
    return testRequest(app, 'content/patch_reorder');
  });

  it('should copy a content object', () => testRequest(app, 'copymove/copy'));

  it('should move a content object', () => testRequest(app, 'copymove/move'));

  it('should update the catalog of the children of a moved folder', async () => {
    const headers = {
      Accept: 'application/json',
      Authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImZ1bGxuYW1lIjoiQWRtaW4iLCJpYXQiOjE2NDkzMTI0NDl9.RS1Ny_r0v7vIylFfK6q0JVJrkiDuTOh9iG9IL8xbzAk',
    };
    await request(app)
      .post('/news/@move')
      .set(headers)
      .send({ source: '/events' })
      .expect(200);
    const res = await request(app)
      .get('/@search?path.query=/news/events&path.depth=1&sort_on=getId')
      .set(headers)
      .expect(200);
    expect(res.body.items.map((item: any) => item['@id'])).toStrictEqual([
      'http://localhost:8080/news/events/event-1',
      'http://localhost:8080/news/events/event-2',
    ]);
  });

  /*
  it('should copy multiple content objects', () => {
    // Mock uuid
    let i = 0;
    // @ts-expect-error Mock implementation does not match type definition, but it is only used in tests
    vi.mocked(uuid).mockImplementation(() => {
      i = i + 1;
      return `a95388f2-e4b3-4292-98aa-62656cbd5b9${i}`;
    });

    return testRequest(app, 'copymove/copy_multiple');
  });
  */

  it('should export a content object', () =>
    testRequest(app, 'content/export'));

  it('should export a content object with an inline disposition', () =>
    testRequest(app, 'content/export_inline'));

  it('should export an ics file for a content object', () =>
    testRequest(app, 'content/ics'));

  it('should export an ics file for a folder object', () =>
    testRequest(app, 'content/ics_folder'));

  it('should export a rss file for a folder object', () =>
    testRequest(app, 'content/rss'));

  it('should export a markdown file for an object', () =>
    testRequest(app, 'content/markdown'));

  it('should add a @plone/plate document with a stale blocks layout', async () => {
    await request(app)
      .post('/news')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send({
        '@type': 'Page',
        id: 'plate',
        title: 'Plate page',
        blocks: {
          __somersault__: {
            '@type': '__somersault__',
            value: [
              { type: 'title', children: [{ text: 'Plate page' }] },
              { type: 'p', children: [{ text: 'Somersault paragraph' }] },
              {
                type: 'ploneBlock',
                '@type': 'html',
                html: '<p>Safe</p><script>alert(1)</script>',
                children: [{ text: '' }],
              },
            ],
          },
        },
        blocks_layout: { items: ['title-uuid', 'slate-uuid'] },
      })
      .expect(201);

    const markdown = await request(app)
      .get('/news/plate')
      .set('Accept', 'text/markdown')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(markdown.text).toBe('# Plate page\n\nSomersault paragraph\n\nSafe');

    const content = await request(app)
      .get('/news/plate')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(content.body.blocks.__somersault__.value[2].html).toBe(
      '<p>Safe</p>',
    );

    const search = await request(app)
      .get('/@search?SearchableText=somersault')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(search.body.items.map((item: any) => item['@id'])).toEqual([
      'http://localhost:8080/news/plate',
    ]);
  });

  it('should ignore a workflow history sent on create', async () => {
    const Document = models.get('Document');
    await request(app)
      .post('/news')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send({
        '@type': 'Page',
        id: 'forged',
        title: 'Forged',
        workflow_history: [
          {
            action: 'publish',
            actor: 'mallory',
            review_state: 'published',
            time: '2001-01-01T00:00:00Z',
          },
        ],
      })
      .expect(201);
    const document = await Document.fetchOne(
      { path: '/news/forged' },
      {},
      global.txn!,
    );
    expect(
      document.workflow_history.map((item: any) => [item.action, item.actor]),
    ).toEqual([[null, 'admin']]);
  });

  it('should only allow site managers to set the uuid', async () => {
    const Document = models.get('Document');
    const contributor = await createUser('contributor');
    const news = await Document.fetchOne({ path: '/news' }, {}, global.txn!);
    await news
      .$relatedQuery('_userRoles', global.txn!)
      .relate({ id: 'Contributor', user: 'contributor' });
    const body = {
      '@type': 'Page',
      id: 'with-uuid',
      title: 'With uuid',
      uuid: '0123abcd-0000-4000-8000-000000000001',
    };

    await request(app)
      .post('/news')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${contributor}`)
      .send(body)
      .expect(403);

    const res = await request(app)
      .post('/news')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(201);
    expect(res.body.UID).toBe(body.uuid);
  });

  it('should validate the type and the fields on create', async () => {
    const post = (body: any) =>
      request(app)
        .post('/news')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send(body);

    expect((await post({ title: 'No type' }).expect(400)).body.message).toBe(
      "Property '@type' is required.",
    );
    expect(
      (await post({ '@type': 'NoSuchType', title: 'x' }).expect(403)).body
        .message,
    ).toBe(
      "Invalid '@type' parameter. No content type with the name “NoSuchType” found.",
    );
    const errors = async (body: any) =>
      JSON.parse((await post(body).expect(400)).body.message);
    expect(await errors({ '@type': 'Page', title: 12345 })).toStrictEqual([
      {
        field: 'title',
        message: 'Object is of wrong type.',
        error: 'ValidationError',
      },
    ]);
    expect(
      (await errors({ '@type': 'Page', title: 'x', description: ['a'] }))[0]
        .field,
    ).toBe('description');
    expect(
      (await errors({ '@type': 'Page', title: 'line1\nline2' }))[0].message,
    ).toBe('Constraint not satisfied');
    expect(
      (await errors({ '@type': 'Page', title: 'x'.repeat(1025) }))[0].message,
    ).toBe('Value is too long');
    expect(
      (await errors({ '@type': 'Page', title: 'x', blocks: 'not-a-dict' }))[0]
        .field,
    ).toBe('blocks');
  });

  it('should validate explicit ids on create', async () => {
    const post = (id: string) =>
      request(app)
        .post('/news')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ '@type': 'Page', id, title: 'x' });

    for (const id of [
      'slash/inside',
      '_underscore',
      '..',
      'aq_parent',
      '@search',
    ]) {
      await post(id).expect(400);
    }

    // The service is not hidden by a child
    const search = await request(app)
      .get('/news/@search')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(search.body.items).toBeDefined();
    await post('has space').expect(201);
    expect((await post('has space').expect(400)).body.message).toBe(
      'The id “has space” is invalid - it is already in use.',
    );
  });

  it('should validate the fields on update', async () => {
    const patch = (body: any) =>
      request(app)
        .patch('/news')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send(body);

    expect(
      JSON.parse((await patch({ title: null }).expect(400)).body.message),
    ).toStrictEqual([
      {
        field: 'title',
        message: 'Required input is missing.',
        error: 'ValidationError',
      },
    ]);
    await patch({ title: { not: 'a string' } }).expect(400);
    await patch({ id: '_news' }).expect(400);
    await patch({ description: null }).expect(204);
  });

  it('should allow ids and titles longer than 255 characters', async () => {
    const res = await request(app)
      .post('/news')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send({ '@type': 'Page', id: 'a'.repeat(300), title: 'y'.repeat(1024) })
      .expect(201);
    expect(res.body.id).toBe('a'.repeat(300));
    expect(res.body.title).toBe('y'.repeat(1024));
  });

  it('should normalize text to the NFC form', async () => {
    const res = await request(app)
      .post('/news')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send({ '@type': 'Page', id: 'combining', title: 'e\u0301 acute' })
      .expect(201);
    expect(res.body.title).toBe('\u00e9 acute');
  });

  it('should accept the uuid as UID', async () => {
    const post = (UID: any) =>
      request(app)
        .post('/news')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ '@type': 'Page', title: 'With UID', UID });

    const res = await post('0123456789abcdef0123456789abcdef').expect(201);
    expect(res.body.UID).toBe('01234567-89ab-cdef-0123-456789abcdef');
    await post('0123456789abcdef0123456789abcdef').expect(400);
    await post('not-a-uuid').expect(400);
  });

  it('should batch the items of a folder', async () => {
    const Document = models.get('Document');
    const news = await Document.fetchOne({ path: '/news' }, {}, global.txn!);
    for (const id of ['c0', 'c1', 'c2', 'c3', 'c4']) {
      await createDocument(
        `0123abcd-0000-4000-8000-00000000010${id[1]}`,
        news,
        id,
        'Page',
        {
          position_in_parent: parseInt(id[1], 10),
        },
      );
    }
    const get = (query: string) =>
      request(app)
        .get(`/news?${query}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

    let res = await get('b_size=2');
    expect(res.body.items_total).toBe(5);
    expect(res.body.items.map((item: any) => item.id)).toStrictEqual([
      'c0',
      'c1',
    ]);
    expect(res.body.batching.next).toBe(
      'http://localhost:8080/news?b_size=2&b_start=2',
    );
    expect(res.body.items[0].description).toBe('');
    expect(res.body.items[0].parent).toBeUndefined();

    res = await get('b_size=2&b_start=4&fullobjects=1');
    expect(res.body.items.map((item: any) => item.id)).toStrictEqual(['c4']);
    expect(res.body.items[0].parent['@id']).toBe('http://localhost:8080/news');

    res = await get('');
    expect(res.body.items_total).toBe(5);
    expect(res.body.batching).toBeUndefined();
  });

  it('should return the content on update if preferred', async () => {
    const res = await request(app)
      .patch('/news')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .set('Prefer', 'return=representation')
      .send({ title: 'Updated news' })
      .expect(200);
    expect(res.body.title).toBe('Updated news');
    expect(res.body.parent['@id']).toBe('http://localhost:8080');
  });

  it('should not return a parent the user can not view', async () => {
    const admin = (req: request.Test) =>
      req
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`);

    // A published page in a private folder
    await admin(request(app).post('/'))
      .send({
        '@type': 'Folder',
        id: 'private-folder',
        uuid: '5d7e9f1a-3b5c-4d6e-8f9a-1b2c3d4e5f01',
        title: 'Secret',
      })
      .expect(201);
    await admin(request(app).post('/private-folder'))
      .send({
        '@type': 'Page',
        id: 'page',
        uuid: '5d7e9f1a-3b5c-4d6e-8f9a-1b2c3d4e5f02',
        title: 'Page',
      })
      .expect(201);
    await admin(
      request(app).post('/private-folder/page/@workflow/publish'),
    ).expect(200);

    // Anonymous can view the page, but not its parent
    const anonymous = await request(app)
      .get('/private-folder/page')
      .set('Accept', 'application/json')
      .expect(200);
    expect(anonymous.body.parent).toBeUndefined();

    // The admin gets the parent
    const res = await admin(request(app).get('/private-folder/page')).expect(
      200,
    );
    expect(res.body.parent.title).toBe('Secret');
  });

  it('should return the location of new content', async () => {
    const res = await request(app)
      .post('/news')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send({ '@type': 'Page', id: 'located', title: 'Located' })
      .expect(201);
    expect(res.headers.location).toBe('http://localhost:8080/news/located');
  });

  it('should order items within a subset and sort them', async () => {
    const Document = models.get('Document');
    const news = await Document.fetchOne({ path: '/news' }, {}, global.txn!);
    const titles: Record<string, string> = {
      a: 'Beta',
      b: 'Alpha',
      c: 'Gamma',
      d: 'Delta',
    };
    for (const [index, id] of ['a', 'b', 'c', 'd'].entries()) {
      await createDocument(
        `0123abcd-0000-4000-8000-00000000020${index}`,
        news,
        id,
        'Page',
        {
          position_in_parent: index,
          json: { title: titles[id] },
        },
      );
    }
    const patch = (body: any) =>
      request(app)
        .patch('/news')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send(body);
    const ids = async () =>
      (
        await request(app)
          .get('/news')
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${token}`)
      ).body.items.map((item: any) => item.id);

    await patch({
      ordering: { obj_id: 'd', delta: 'top', subset_ids: ['c', 'd'] },
    }).expect(204);
    expect(await ids()).toStrictEqual(['a', 'b', 'd', 'c']);

    await patch({
      ordering: { obj_id: 'a', delta: 1, subset_ids: ['c', 'a'] },
    }).expect(400);
    await patch({ ordering: { obj_id: 'unknown', delta: 1 } }).expect(400);
    await patch({ ordering: { obj_id: 'a', delta: 'sideways' } }).expect(400);
    await patch({ ordering: { obj_id: 'a', delta: 1.5 } }).expect(400);
    expect(await ids()).toStrictEqual(['a', 'b', 'd', 'c']);
    await patch({ ordering: { obj_id: 'b', delta: -10 } }).expect(204);
    expect(await ids()).toStrictEqual(['b', 'a', 'd', 'c']);

    await patch({
      sort: { on: 'sortable_title', order: 'descending' },
    }).expect(204);
    expect(await ids()).toStrictEqual(['c', 'd', 'a', 'b']);

    await patch({
      ordering: { obj_id: 'b', delta: 'top' },
      title: 'Sorted news',
    }).expect(204);
    expect(await ids()).toStrictEqual(['b', 'c', 'd', 'a']);
    const res = await request(app)
      .get('/news')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.title).toBe('Sorted news');
  });

  it('should prefix the id of a copy in the same folder', async () => {
    const res = await request(app)
      .post('/events/@copy')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send({ source: '/events/event-1' })
      .expect(200);
    expect(res.body[0].target).toBe(
      'http://localhost:8080/events/copy_of_event-1',
    );
  });

  it('should require the delete permission', async () => {
    const Document = models.get('Document');
    const news = await Document.fetchOne({ path: '/news' }, {}, global.txn!);
    const pending = await createDocument(
      '0123abcd-0000-4000-8000-000000000002',
      news,
      'pending',
      'Page',
      { workflow_state: 'pending' },
    );
    const reviewer = await createUser('reviewer');
    const editor = await createUser('editor');
    await pending
      .$relatedQuery('_userRoles', global.txn!)
      .relate({ id: 'Reviewer', user: 'reviewer' });
    await pending
      .$relatedQuery('_userRoles', global.txn!)
      .relate({ id: 'Editor', user: 'editor' });

    // A reviewer may modify a pending item but not delete it
    await request(app)
      .patch('/news/pending')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${reviewer}`)
      .send({ title: 'Reviewed' })
      .expect(204);
    await request(app)
      .delete('/news/pending')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${reviewer}`)
      .expect(401);

    // An editor may delete it
    await request(app)
      .delete('/news/pending')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${editor}`)
      .expect(204);
  });

  it('should only serve images of the document itself', async () => {
    // Add a private image, all uuids are mocked
    vi.mocked(validate).mockReturnValue(true);
    const imageUuid = uuid();
    await request(app)
      .post('/news')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        '@type': 'Image',
        id: 'private-image',
        title: 'Private Image',
        image: {
          data: png,
          encoding: 'base64',
          'content-type': 'image/png',
          filename: 'private.png',
        },
      })
      .expect(201);

    // Not through a published item or the site root
    await request(app).get(`/news/@@images/${imageUuid}.png`).expect(404);
    await request(app).get(`/@@images/${imageUuid}.png`).expect(404);

    // Not for anonymous on the private image itself
    await request(app)
      .get(`/news/private-image/@@images/${imageUuid}.png`)
      .expect(401);

    // But for the admin on the image itself
    return request(app)
      .get(`/news/private-image/@@images/${imageUuid}.png`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('should not show uploaded html inline', async () => {
    vi.mocked(validate).mockReturnValue(true);
    const addFile = (id: string, contentType: string) =>
      request(app)
        .post('/news')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          '@type': 'File',
          id,
          uuid: id === 'html' ? uuid() : '1f6bc2f4-4a0c-4c4e-9a3c-2b8c1b7d6e01',
          title: id,
          file: {
            data: Buffer.from('<script>alert(1)</script>').toString('base64'),
            encoding: 'base64',
            'content-type': contentType,
            filename: `${id}.txt`,
          },
        })
        .expect(201);

    // Html is always an attachment
    await addFile('html', 'text/html');
    const html = await request(app)
      .get('/news/html/@@download/file?disposition=inline')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(html.headers['content-disposition']).toBe(
      'attachment; filename="html.txt"',
    );
    expect(html.headers['x-content-type-options']).toBe('nosniff');

    // Plain text can be shown inline
    await addFile('text', 'text/plain');
    const text = await request(app)
      .get('/news/text/@@download/file?disposition=inline')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(text.headers['content-disposition']).toBe(
      'inline; filename="text.txt"',
    );
  });

  it('should only serialize related items the user can view', async () => {
    const events = '1a2123ba-14e8-4910-8e6b-c04a40d72a41';
    const privatePage = '7d2c4e6f-8a9b-4c1d-9e2f-3a4b5c6d7e01';
    const admin = (req: request.Test) =>
      req
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminToken}`);

    // A private page and a published page relating to it and to events
    await admin(request(app).post('/news'))
      .send({
        '@type': 'Page',
        id: 'private-page',
        uuid: privatePage,
        title: 'Private Page',
      })
      .expect(201);
    await admin(request(app).post('/news'))
      .send({
        '@type': 'Page',
        id: 'page',
        uuid: '7d2c4e6f-8a9b-4c1d-9e2f-3a4b5c6d7e02',
        title: 'Page',
        relatedItems: [privatePage, events],
      })
      .expect(201);
    await admin(request(app).post('/news/page/@workflow/publish')).expect(200);
    const related = (res: request.Response) =>
      res.body.relatedItems.map((item: any) => item.UID).sort();

    // Anonymous only gets the published events folder
    const anonymous = await request(app)
      .get('/news/page')
      .set('Accept', 'application/json')
      .expect(200);
    expect(related(anonymous)).toEqual([events]);

    // Admin gets both
    const res = await admin(request(app).get('/news/page')).expect(200);
    expect(related(res)).toEqual([events, privatePage].sort());
  });

  it('should copy a folder into its own subfolder once', async () => {
    const admin = (req: request.Test) =>
      req
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminToken}`);
    const add = (path: string, type: string, id: string, uid: string) =>
      admin(request(app).post(path))
        .send({ '@type': type, id, uuid: uid, title: id })
        .expect(201);
    await add('/news', 'Folder', 'f', '9a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c01');
    await add(
      '/news/f',
      'Folder',
      'sub',
      '9a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c02',
    );
    await add('/news/f', 'Page', 'c', '9a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c03');

    // Give every copy its own uuid
    let i = 10;
    vi.mocked(uuid).mockImplementation(
      (() => `9a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c${i++}`) as any,
    );

    await admin(request(app).post('/news/f/sub/@copy'))
      .send({ source: '/news/f' })
      .expect(200);
    vi.mocked(uuid).mockReturnValue(
      'a95388f2-e4b3-4292-98aa-62656cbd5b9c' as any,
    );

    // The copy has the original children, but not itself again
    const ids = (res: request.Response) =>
      res.body.items.map((item: any) => item.id).sort();
    expect(
      ids(await admin(request(app).get('/news/f/sub/f')).expect(200)),
    ).toEqual(['c', 'sub']);
    expect(
      ids(await admin(request(app).get('/news/f/sub/f/sub')).expect(200)),
    ).toEqual([]);
  });

  it('should not stream a private video to anonymous', async () => {
    vi.mocked(validate).mockReturnValue(true);
    await request(app)
      .post('/news')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        '@type': 'Video',
        id: 'private-video',
        title: 'Private Video',
        video: {
          data: Buffer.from('video').toString('base64'),
          encoding: 'base64',
          'content-type': 'video/mp4',
          filename: 'private.mp4',
        },
      })
      .expect(201);
    await request(app)
      .get('/news/private-video/@@videos/video')
      .set('Accept', 'application/json')
      .expect(401);
    return request(app)
      .get('/news/private-video/@@videos/video')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('should check the permissions on the sources of copy and move', async () => {
    const admin = (req: request.Test) =>
      req
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminToken}`);
    await admin(request(app).post('/'))
      .send({
        '@type': 'Page',
        id: 'private-page',
        uuid: '4f6a8c0e-2b4d-4f6a-8c0e-2b4d6f8a0c01',
        title: 'Private Page',
      })
      .expect(201);

    // A contributor of the events folder
    const token = await createUserWithToken('contributor');
    await admin(request(app).post('/events/@sharing'))
      .send({
        entries: [
          { id: 'contributor', type: 'user', roles: { Contributor: true } },
        ],
        inherit: true,
      })
      .expect(204);
    const contributor = (req: request.Test) =>
      req
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`);

    // A private item is not copied or moved
    const copy = await contributor(request(app).post('/events/@copy'))
      .send({ source: '/private-page' })
      .expect(200);
    expect(copy.body).toEqual([]);
    const move = await contributor(request(app).post('/events/@move'))
      .send({ source: '/private-page' })
      .expect(200);
    expect(move.body).toEqual([]);
    await admin(request(app).get('/private-page')).expect(200);
    await admin(request(app).get('/events/private-page')).expect(404);

    // A viewable item the contributor can't modify is not moved
    await contributor(request(app).post('/events/@move'))
      .send({ source: '/news' })
      .expect(403);
  });

  it('should serve an image with a non-ascii filename by uuid', async () => {
    vi.mocked(validate).mockReturnValue(true);
    const imageUuid = uuid();
    await request(app)
      .post('/news')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        '@type': 'Image',
        id: 'image',
        title: 'Image',
        image: {
          data: png,
          encoding: 'base64',
          'content-type': 'image/png',
          filename: 'bild-æøå.png',
        },
      })
      .expect(201);
    return request(app)
      .get(`/news/image/@@images/${imageUuid}.png`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});

describe('Ranges', () => {
  // 3000 bytes, byte i is the digit i % 10
  const payload = Buffer.from('0123456789'.repeat(300));

  // Read the body as a buffer
  const binary = (
    res: request.Response,
    callback: (err: Error | null, body: Buffer) => void,
  ) => {
    const chunks: Buffer[] = [];
    res.on('data', (chunk: Buffer) => chunks.push(chunk));
    res.on('end', () => callback(null, Buffer.concat(chunks)));
  };

  const addFile = async (type: string, field: string) => {
    vi.mocked(validate).mockReturnValue(true);
    await request(app)
      .post('/news')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        '@type': type,
        id: 'media',
        title: 'Media',
        [field]: {
          data: payload.toString('base64'),
          encoding: 'base64',
          'content-type': 'video/mp4',
          filename: 'media.mp4',
        },
      })
      .expect(201);
  };

  const get = (path: string, range?: string) => {
    const req = request(app)
      .get(`/news/media/${path}`)
      .set('Authorization', `Bearer ${adminToken}`);
    if (range) {
      req.set('Range', range);
    }
    return req.buffer(true).parse(binary);
  };

  describe('@@download', () => {
    beforeEach(() => addFile('File', 'file'));

    it('should serve the whole file without a range', async () => {
      const res = await get('@@download/file').expect(200);
      expect(res.headers['accept-ranges']).toBe('bytes');
      expect(res.headers['content-length']).toBe('3000');
      expect(res.headers['content-range']).toBeUndefined();
      expect(res.body.equals(payload)).toBe(true);
    });

    it('should serve a range with a start and an end', async () => {
      const res = await get('@@download/file', 'bytes=0-999').expect(206);
      expect(res.headers['content-range']).toBe('bytes 0-999/3000');
      expect(res.headers['content-length']).toBe('1000');
      expect(res.body.equals(payload.subarray(0, 1000))).toBe(true);
    });

    it('should serve a range with an open end up to the last byte', async () => {
      const res = await get('@@download/file', 'bytes=1000-').expect(206);
      expect(res.headers['content-range']).toBe('bytes 1000-2999/3000');
      expect(res.body.equals(payload.subarray(1000))).toBe(true);
    });

    it('should serve the last bytes', async () => {
      const res = await get('@@download/file', 'bytes=-500').expect(206);
      expect(res.headers['content-range']).toBe('bytes 2500-2999/3000');
      expect(res.body.equals(payload.subarray(2500))).toBe(true);
    });

    it('should limit the end to the last byte', async () => {
      const res = await get('@@download/file', 'bytes=2000-99999').expect(206);
      expect(res.headers['content-range']).toBe('bytes 2000-2999/3000');
      expect(res.body.equals(payload.subarray(2000))).toBe(true);
    });

    it('should refuse a range outside of the file', async () => {
      const res = await get('@@download/file', 'bytes=3000-').expect(416);
      expect(res.headers['content-range']).toBe('bytes */3000');
    });

    it('should serve the whole file for other ranges', async () => {
      for (const range of ['bytes=0-1,10-11', 'chunks=0-1', 'bytes=5-3']) {
        const res = await get('@@download/file', range).expect(200);
        expect(res.headers['content-length']).toBe('3000');
        expect(res.body.equals(payload)).toBe(true);
      }
    });
  });

  describe('@@videos', () => {
    beforeEach(() => addFile('Video', 'video'));

    it('should stream the video in chunks', async () => {
      const limits = config.settings.requestLimit as { chunk: string };
      const chunk = limits.chunk;
      limits.chunk = '1000';
      try {
        const first = await get('@@videos/video').expect(206);
        expect(first.headers['content-range']).toBe('bytes 0-999/3000');
        const next = await get('@@videos/video', 'bytes=1000-').expect(206);
        expect(next.headers['content-range']).toBe('bytes 1000-1999/3000');
        expect(next.body.equals(payload.subarray(1000, 2000))).toBe(true);
      } finally {
        limits.chunk = chunk;
      }
    });

    it('should serve the last bytes', async () => {
      const res = await get('@@videos/video', 'bytes=-500').expect(206);
      expect(res.headers['content-range']).toBe('bytes 2500-2999/3000');
      expect(res.body.equals(payload.subarray(2500))).toBe(true);
    });

    it('should refuse a range outside of the file', async () => {
      const res = await get('@@videos/video', 'bytes=5000-').expect(416);
      expect(res.headers['content-range']).toBe('bytes */3000');
    });
  });
});

describe('Expand', () => {
  // plone.restapi accepts a Zope :list, a comma separated string and a single
  // value, every form expands the same components
  const get = (querystring: string) =>
    request(app)
      .get(`/${querystring}`)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

  const expectExpanded = (body: any) => {
    expect(body['@components'].breadcrumbs.items).toBeInstanceOf(Array);
    expect(body['@components'].navigation.items).toBeInstanceOf(Array);
    expect(body['@components'].actions.object).toBeUndefined();
  };

  it('should not expand components that were not asked for', async () => {
    const res = await get('');
    expect(res.body['@components'].navigation.items).toBeUndefined();
  });

  it('should expand the :list form', async () => {
    const res = await get('?expand:list=breadcrumbs&expand:list=navigation');
    expectExpanded(res.body);
  });

  it('should expand the comma separated form', async () => {
    const res = await get('?expand=breadcrumbs,navigation');
    expectExpanded(res.body);
  });

  it('should expand a repeated parameter without :list', async () => {
    const res = await get('?expand=breadcrumbs&expand=navigation');
    expectExpanded(res.body);
  });
});

describe('Language', () => {
  const add = (path: string, body: object) =>
    request(app)
      .post(path)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body)
      .expect(201);

  it('should give new content the language of its container', async () => {
    await add('/', {
      '@type': 'Folder',
      uuid: '7d1e0c2a-5b3f-4c6d-8e9f-0a1b2c3d4e01',
      id: 'nl',
      title: 'NL',
      language: 'nl',
    });
    const page = await add('/nl', {
      '@type': 'Page',
      uuid: '7d1e0c2a-5b3f-4c6d-8e9f-0a1b2c3d4e02',
      title: 'Pagina',
    });
    expect(page.body.language).toEqual({ token: 'nl', title: 'Nederlands' });

    // Unless the language is sent
    const other = await add('/nl', {
      '@type': 'Page',
      uuid: '7d1e0c2a-5b3f-4c6d-8e9f-0a1b2c3d4e03',
      title: 'Page',
      language: 'en',
    });
    expect(other.body.language.token).toBe('en');
  });
});
