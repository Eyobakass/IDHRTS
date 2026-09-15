import { useAuthStore } from '../store/authStore';

describe('useAuthStore', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState({ token: null, role: null });
    });

    it('setAuth stores token and role in state and localStorage', () => {
        const { setAuth } = useAuthStore.getState();
        setAuth('test-token-123', 'LANDLORD');

        expect(useAuthStore.getState().token).toBe('test-token-123');
        expect(useAuthStore.getState().role).toBe('LANDLORD');
        expect(localStorage.getItem('access_token')).toBe('test-token-123');
        expect(localStorage.getItem('user_role')).toBe('LANDLORD');
    });

    it('logout clears token and role from state and localStorage', () => {
        const { setAuth, logout } = useAuthStore.getState();
        setAuth('test-token-123', 'LANDLORD');
        logout();

        expect(useAuthStore.getState().token).toBeNull();
        expect(useAuthStore.getState().role).toBeNull();
        expect(localStorage.getItem('access_token')).toBeNull();
        expect(localStorage.getItem('user_role')).toBeNull();
    });

    it('initial state is null when localStorage is empty', () => {
        useAuthStore.setState({ token: null, role: null });
        expect(useAuthStore.getState().token).toBeNull();
        expect(useAuthStore.getState().role).toBeNull();
    });

    it('setAuth with LANDLORD role sets role correctly', () => {
        const { setAuth } = useAuthStore.getState();
        setAuth('landlord-token', 'LANDLORD');
        expect(useAuthStore.getState().role).toBe('LANDLORD');
    });

    it('multiple setAuth calls override previous values', () => {
        const { setAuth } = useAuthStore.getState();
        setAuth('token-1', 'TENANT');
        expect(useAuthStore.getState().token).toBe('token-1');

        setAuth('token-2', 'WOREDA_OFFICER');
        expect(useAuthStore.getState().token).toBe('token-2');
        expect(useAuthStore.getState().role).toBe('WOREDA_OFFICER');
        expect(localStorage.getItem('user_role')).toBe('WOREDA_OFFICER');
    });

    it('logout after no login does not throw', () => {
        const { logout } = useAuthStore.getState();
        expect(() => logout()).not.toThrow();
        expect(useAuthStore.getState().token).toBeNull();
    });
});
