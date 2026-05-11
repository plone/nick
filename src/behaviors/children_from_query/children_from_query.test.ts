/**
 * Children from query behavior tests.
 * @module behaviors/children_from_query/children_from_query.test
 */

// External imports
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Internal imports
import { children_from_query } from './children_from_query';
import * as modelsModule from '../../models';
import * as queryModule from '../../helpers/query/query';

describe('children_from_query', () => {
  let mockCatalog: any;
  let mockDocument: any;
  let mockTrx: any;
  let mockReq: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTrx = {} as any;
    mockReq = {} as any;

    mockCatalog = {
      fetchAllRestricted: vi.fn(),
    };

    mockDocument = {
      fetchAll: vi.fn(),
    };

    vi.spyOn(modelsModule.default, 'get')
      .mockReturnValueOnce(mockCatalog)
      .mockReturnValueOnce(mockDocument);

    vi.spyOn(queryModule, 'querystringToQuery').mockResolvedValue([
      {},
      {
        offset: 0,
        limit: 0,
        order: { column: 'id', reverse: false },
        select: undefined,
      },
    ]);
  });

  describe('fetchChildren', () => {
    it('should fetch children and set _children on the document', async () => {
      const catalogItems = [{ UID: 'uuid-1' }, { UID: 'uuid-2' }];
      mockCatalog.fetchAllRestricted.mockResolvedValue(catalogItems);

      const docModels = [{ id: 1 }, { id: 2 }];
      mockDocument.fetchAll.mockResolvedValue({ models: docModels });

      const doc = {
        id: 'doc-1',
        json: { query: { query: [] } },
        _children: undefined,
      } as any;

      await children_from_query.fetchChildren.call(doc, mockReq, mockTrx);

      expect(queryModule.querystringToQuery).toHaveBeenCalledWith(
        { query: [] },
        '/',
        mockReq,
        mockTrx,
      );
      expect(mockCatalog.fetchAllRestricted).toHaveBeenCalled();
      expect(mockDocument.fetchAll).toHaveBeenCalledWith(
        { uuid: ['=', ['uuid-1', 'uuid-2']] },
        {},
        mockTrx,
      );
      expect(doc._children).toEqual(docModels);
    });

    it('should handle empty query results', async () => {
      mockCatalog.fetchAllRestricted.mockResolvedValue([]);
      mockDocument.fetchAll.mockResolvedValue({ models: [] });

      const doc = {
        id: 'doc-1',
        json: { query: { query: [] } },
        _children: undefined,
      } as any;

      await children_from_query.fetchChildren.call(doc, mockReq, mockTrx);

      expect(doc._children).toEqual([]);
    });
  });
});
