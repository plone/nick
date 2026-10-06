/**
 * Content multipart/form-data tests.
 * @module routes/content/content-multipart
 */

// External imports
import request from 'supertest';
import { describe, expect, it } from 'vitest';

// Internal imports
import app from '../../app';

const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImZ1bGxuYW1lIjoiQWRtaW4iLCJpYXQiOjE2NDkzMTI0NDl9.RS1Ny_r0v7vIylFfK6q0JVJrkiDuTOh9iG9IL8xbzAk';

/**
 * Turn a JSON object into the buffer sent as the `data` part of a multipart request.
 */
function dataPart(json: Record<string, unknown>): Buffer {
  return Buffer.from(JSON.stringify(json));
}

describe('Content multipart/form-data', () => {
  it('should add a File content object via multipart/form-data', async () => {
    const response = await request(app)
      .post('/news')
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json')
      .attach(
        'data',
        dataPart({
          '@type': 'File',
          title: 'My File',
          file: { part: 'attachment_0' },
        }),
        { filename: 'data.json', contentType: 'application/json' },
      )
      .attach('attachment_0', Buffer.from('Spam and Eggs'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('My File');
    expect(response.body.file).toMatchObject({
      'content-type': 'text/plain',
      filename: 'test.txt',
      size: Buffer.byteLength('Spam and Eggs'),
    });
  });

  it('should fall back to the part filename and content-type when omitted from the JSON', async () => {
    const response = await request(app)
      .post('/news')
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json')
      .attach(
        'data',
        dataPart({
          '@type': 'File',
          title: 'My Other File',
          file: { part: 'attachment_0' },
        }),
        { filename: 'data.json', contentType: 'application/json' },
      )
      .attach('attachment_0', Buffer.from('Hello'), {
        filename: 'hello.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(201);
    expect(response.body.file).toMatchObject({
      'content-type': 'text/plain',
      filename: 'hello.txt',
    });
  });

  it('should update a content object via multipart/form-data with no file part', async () => {
    await request(app)
      .post('/news')
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json')
      .attach(
        'data',
        dataPart({
          '@type': 'File',
          title: 'My File',
          file: { part: 'attachment_0' },
        }),
        { filename: 'data.json', contentType: 'application/json' },
      )
      .attach('attachment_0', Buffer.from('Spam and Eggs'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      });

    const response = await request(app)
      .patch('/news/my-file')
      .set('Authorization', `Bearer ${token}`)
      .attach('data', dataPart({ title: 'Updated title' }), {
        filename: 'data.json',
        contentType: 'application/json',
      });

    expect(response.status).toBe(204);
  });

  it('should reject a reference to a missing part with a 400', async () => {
    const response = await request(app)
      .post('/news')
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json')
      .attach(
        'data',
        dataPart({
          '@type': 'File',
          title: 'My File',
          file: { part: 'missing' },
        }),
        { filename: 'data.json', contentType: 'application/json' },
      );

    expect(response.status).toBe(400);
  });

  it('should treat a multipart request with no data part as an empty body', async () => {
    const response = await request(app)
      .post('/news')
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json')
      .attach('attachment_0', Buffer.from('Spam and Eggs'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      });

    // No `@type`, which fails the same way an empty `{}` JSON POST already does
    // today (a pre-existing gap: `Type.fetchById(undefined, ...)` throws instead
    // of the route's own 400 "Type not found" check ever being reached).
    expect(response.status).toBe(500);
  });
});
