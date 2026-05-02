import { describe, it } from 'vitest';
import app from '../../app';
import { testRequest } from '../../helpers/tests/tests';

describe('Context Navigation', () => {
  it('should return the context navigation', () =>
    testRequest(app, 'contextnavigation/get'));
});
