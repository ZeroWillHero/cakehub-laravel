import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { api as ApiType } from './api';

function jsonResponse(ok: boolean, body: unknown): Response {
    return { ok, json: async () => body } as Response;
}

async function freshApi(): Promise<typeof ApiType> {
    vi.resetModules();
    const mod = await import('./api');
    return mod.api;
}

describe('api client', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'fetch',
            vi.fn((url: string) => {
                if (url === '/sanctum/csrf-cookie') {
                    return Promise.resolve(jsonResponse(true, {}));
                }
                return Promise.resolve(jsonResponse(true, { data: null }));
            }),
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('unwraps the "data" envelope on a successful GET', async () => {
        vi.mocked(fetch).mockImplementation(() => Promise.resolve(jsonResponse(true, { data: { id: 1 } })));
        const api = await freshApi();

        const result = await api.get<{ id: number }>('/things');

        expect(result).toEqual({ id: 1 });
        expect(fetch).toHaveBeenCalledWith('/api/things', expect.objectContaining({ method: 'GET' }));
    });

    it('throws the error envelope on a failed request', async () => {
        vi.mocked(fetch).mockImplementation((url) => {
            if (url === '/sanctum/csrf-cookie') return Promise.resolve(jsonResponse(true, {}));
            return Promise.resolve(
                jsonResponse(false, { message: 'Validation failed', errors: { name: ['Required'] } }),
            );
        });
        const api = await freshApi();

        await expect(api.post('/things', { name: '' })).rejects.toEqual({
            message: 'Validation failed',
            errors: { name: ['Required'] },
        });
    });

    it('primes the CSRF cookie before a non-GET request', async () => {
        const api = await freshApi();

        await api.post('/things', { name: 'x' });

        const csrfCall = vi.mocked(fetch).mock.calls.find(([url]) => url === '/sanctum/csrf-cookie');
        expect(csrfCall).toBeDefined();
    });

    it('does not prime the CSRF cookie for a GET request', async () => {
        const api = await freshApi();

        await api.get('/things');

        const csrfCall = vi.mocked(fetch).mock.calls.find(([url]) => url === '/sanctum/csrf-cookie');
        expect(csrfCall).toBeUndefined();
    });

    it('only primes the CSRF cookie once across multiple non-GET requests', async () => {
        const api = await freshApi();

        await api.post('/things', { name: 'a' });
        await api.post('/things', { name: 'b' });

        const csrfCalls = vi.mocked(fetch).mock.calls.filter(([url]) => url === '/sanctum/csrf-cookie');
        expect(csrfCalls).toHaveLength(1);
    });
});
