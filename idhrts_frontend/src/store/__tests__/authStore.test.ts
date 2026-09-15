import { useAuthStore } from '../authStore';

describe('authStore', () => {
  let getItemSpy: jest.SpyInstance;
  let setItemSpy: jest.SpyInstance;
  let removeItemSpy: jest.SpyInstance;

  beforeEach(() => {
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

    getItemSpy.mockClear();
    setItemSpy.mockClear();
    removeItemSpy.mockClear();
    
    useAuthStore.setState({ token: null, role: null });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('setAuth extracts token and sets in localStorage', () => {
    const { setAuth } = useAuthStore.getState();
    setAuth('new-jwt-token', 'TENANT');
    
    expect(setItemSpy).toHaveBeenCalledWith('access_token', 'new-jwt-token');
    expect(setItemSpy).toHaveBeenCalledWith('user_role', 'TENANT');
    expect(useAuthStore.getState().token).toBe('new-jwt-token');
    expect(useAuthStore.getState().role).toBe('TENANT');
  });

  it('logout removes JWT and role from localStorage', () => {
    const { setAuth, logout } = useAuthStore.getState();
    setAuth('temp-jwt', 'LANDLORD');
    
    logout();
    
    expect(removeItemSpy).toHaveBeenCalledWith('access_token');
    expect(removeItemSpy).toHaveBeenCalledWith('user_role');
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().role).toBeNull();
  });


});
