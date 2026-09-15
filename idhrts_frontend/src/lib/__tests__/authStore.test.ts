import { useAuthStore } from '../../store/authStore';

describe('authStore', () => {
  let setItemSpy: jest.SpyInstance;
  let removeItemSpy: jest.SpyInstance;

  beforeEach(() => {
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
    setItemSpy.mockClear();
    removeItemSpy.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('setAuth sets token and role', () => {
    const { setAuth } = useAuthStore.getState();
    setAuth('t1', 'r1');
    expect(setItemSpy).toHaveBeenCalledWith('access_token', 't1');
    expect(setItemSpy).toHaveBeenCalledWith('user_role', 'r1');
    expect(useAuthStore.getState().token).toBe('t1');
    expect(useAuthStore.getState().role).toBe('r1');
  });

  it('logout removes token and role', () => {
    const { logout } = useAuthStore.getState();
    logout();
    expect(removeItemSpy).toHaveBeenCalledWith('access_token');
    expect(removeItemSpy).toHaveBeenCalledWith('user_role');
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().role).toBeNull();
  });
});
