import { api } from '../lib/api';

describe('API Axios Instance', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('api instance has the correct baseURL', () => {
        expect(api.defaults.baseURL).toBe('http://127.0.0.1:8000/api');
    });

    it('request interceptor adds Authorization header when token exists in localStorage', async () => {
        localStorage.setItem('access_token', 'my-test-jwt-token');
        const interceptorFulfilled = (api.interceptors.request as any).handlers[0].fulfilled;
        const config = { headers: {} as Record<string, string> };
        const result = await interceptorFulfilled(config);
        expect(result.headers['Authorization']).toBe('Bearer my-test-jwt-token');
    });

    it('request interceptor does NOT add Authorization header when no token', async () => {
        const interceptorFulfilled = (api.interceptors.request as any).handlers[0].fulfilled;
        const config = { headers: {} as Record<string, string> };
        const result = await interceptorFulfilled(config);
        expect(result.headers['Authorization']).toBeUndefined();
    });
});
