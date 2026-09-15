/**
 * @jest-environment node
 */
import { api } from '../api';

describe('API Axios Instance - Node Environment', () => {
  it('does not crash when window is undefined', () => {
    expect(typeof window).toBe('undefined');
    
    const interceptor = (api.interceptors.request as any).handlers[0].fulfilled;
    const config = { headers: {} as Record<string, string>, url: '/some/endpoint' };
    
    const result = interceptor(config);
    expect(result.headers['Authorization']).toBeUndefined();
  });
});
