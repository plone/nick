import { describe, it } from 'vitest';
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Linkintegrity', () => {
  it('should return the linkintegrity', () =>
    testRequest(app, 'linkintegrity/get'));
});
