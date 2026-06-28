import { afterEach, describe, expect, it, vi } from 'vitest';

import { getAsset, listAssets, listCategories, search } from '@/lib/api';

const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

afterEach(() => {
  mockFetch.mockReset();
});

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
}

describe('api client', () => {
  it('listAssets fetches paginated assets', async () => {
    const payload = {
      items: [{ id: '1', slug: 'test', title: 'Test' }],
      total: 1,
      page: 1,
      limit: 20,
    };
    mockFetch.mockReturnValueOnce(jsonResponse(payload));

    const result = await listAssets({ page: 1, limit: 20 });
    expect(result).toEqual(payload);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/assets?page=1&limit=20'),
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('getAsset fetches a single asset by slug', async () => {
    const asset = { id: '1', slug: 'intro', title: 'Intro' };
    mockFetch.mockReturnValueOnce(jsonResponse(asset));

    const result = await getAsset('intro');
    expect(result).toEqual(asset);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/assets/intro'),
      expect.any(Object),
    );
  });

  it('search sends query parameters', async () => {
    const payload = { query: 'algorithm', results: [], page: 1, limit: 20 };
    mockFetch.mockReturnValueOnce(jsonResponse(payload));

    await search({ q: 'algorithm', page: 1 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/search?q=algorithm&page=1'),
      expect.any(Object),
    );
  });

  it('listCategories fetches category tree', async () => {
    const tree = [{ id: '1', slug: 'cs', name: 'CS', children: [] }];
    mockFetch.mockReturnValueOnce(jsonResponse(tree));

    const result = await listCategories();
    expect(result).toEqual(tree);
  });

  it('throws ApiClientError on failed response', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ error: 'not_found' }, 404));

    await expect(getAsset('missing')).rejects.toMatchObject({ status: 404, code: 'not_found' });
  });
});
