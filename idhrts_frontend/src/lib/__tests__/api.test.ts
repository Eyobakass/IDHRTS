import { api } from '../api';

describe('API Axios Instance', () => {
  let getItemSpy: jest.SpyInstance;
  const originalWindow = global.window;

  beforeEach(() => {
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    getItemSpy.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.window = originalWindow;
  });

  it('extracts token from localStorage and attaches Authorization header', async () => {
    getItemSpy.mockReturnValue('mocked-jwt-token');
    
    const interceptor = (api.interceptors.request as any).handlers[0].fulfilled;
    const config = { headers: {} as Record<string, string>, url: '/some/endpoint' };
    
    const result = await interceptor(config);
    
    expect(getItemSpy).toHaveBeenCalledWith('access_token');
    expect(result.headers['Authorization']).toBe('Bearer mocked-jwt-token');
  });

  it('does not attach Authorization header if token is missing', async () => {
    getItemSpy.mockReturnValue(null);
    
    const interceptor = (api.interceptors.request as any).handlers[0].fulfilled;
    const config = { headers: {} as Record<string, string>, url: '/some/endpoint' };
    
    const result = await interceptor(config);
    
    expect(getItemSpy).toHaveBeenCalledWith('access_token');
    expect(result.headers['Authorization']).toBeUndefined();
  });

  it('does not attach Authorization header for /auth/login endpoint', async () => {
    getItemSpy.mockReturnValue('mocked-jwt-token');
    
    const interceptor = (api.interceptors.request as any).handlers[0].fulfilled;
    const config = { headers: {} as Record<string, string>, url: '/auth/login' };
    
    const result = await interceptor(config);
    
    expect(result.headers['Authorization']).toBeUndefined();
  });


});
